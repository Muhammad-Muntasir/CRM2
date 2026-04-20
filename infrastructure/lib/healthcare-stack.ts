import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class HealthcareCrmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── DynamoDB Tables ──────────────────────────────────────────────────────

    const notesTable = new dynamodb.Table(this, 'NotesTable', {
      tableName: 'healthcare-crm-notes',
      partitionKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    notesTable.addGlobalSecondaryIndex({
      indexName: 'patientId-index',
      partitionKey: { name: 'patientId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const patientsTable = new dynamodb.Table(this, 'PatientsTable', {
      tableName: 'healthcare-crm-patients',
      partitionKey: { name: 'patientId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // ─── Cognito User Pool ────────────────────────────────────────────────────

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'healthcare-crm-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'healthcare-crm-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // ─── IAM Role for Lambda ──────────────────────────────────────────────────
    // Explicit least-privilege role — only what Lambda needs

    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: 'healthcare-crm-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Healthcare CRM Lambda functions',
    });

    // CloudWatch Logs — write logs
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }));

    // DynamoDB Notes table — full CRUD + GSI query
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowDynamoDBNotes',
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [
        notesTable.tableArn,
        `${notesTable.tableArn}/index/patientId-index`,
      ],
    }));

    // DynamoDB Patients table — full CRUD
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowDynamoDBPatients',
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ],
      resources: [patientsTable.tableArn],
    }));

    // ─── Lambda shared config ─────────────────────────────────────────────────

    const backendCode = lambda.Code.fromAsset(
      path.join(__dirname, '../../backend')
    );

    const lambdaEnv: Record<string, string> = {
      NOTES_TABLE: notesTable.tableName,
      PATIENTS_TABLE: patientsTable.tableName,
      USER_POOL_ID: userPool.userPoolId,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_22_X,
      role: lambdaRole,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      code: backendCode,
    };

    // ─── Single Lambda Function ───────────────────────────────────────────────

    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-api',
      handler: 'dist/src/handlers/index.handler',
      description: 'Single Lambda handler for all Healthcare CRM API routes',
      logGroup: new logs.LogGroup(this, 'ApiHandlerLogGroup', {
        logGroupName: '/aws/lambda/healthcare-crm-api',
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // ─── IAM Role for API Gateway CloudWatch Logging ──────────────────────────

    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      roleName: 'healthcare-crm-apigw-cloudwatch-role',
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Allows API Gateway to write logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // ─── API Gateway ──────────────────────────────────────────────────────────

    const api = new apigateway.RestApi(this, 'HealthcareApi', {
      restApiName: 'healthcare-crm-api',
      description: 'Healthcare CRM REST API',
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false,
      },
    });

    // Cognito Authorizer — validates Bearer JWT on every protected route
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        authorizerName: 'healthcare-crm-authorizer',
        identitySource: 'method.request.header.Authorization',
        resultsCacheTtl: cdk.Duration.minutes(5),
      }
    );

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ─── API Routes ───────────────────────────────────────────────────────────

    const integration = new apigateway.LambdaIntegration(apiHandler);

    // /notes
    const notes = api.root.addResource('notes');
    notes.addMethod('POST', integration, authOptions);

    const noteById = notes.addResource('{noteId}');
    noteById.addMethod('PUT', integration, authOptions);
    noteById.addMethod('DELETE', integration, authOptions);

    // /patients
    const patients = api.root.addResource('patients');
    patients.addMethod('GET', integration, authOptions);
    patients.addMethod('POST', integration, authOptions);

    const patientById = patients.addResource('{patientId}');
    patientById.addMethod('DELETE', integration, authOptions);
    patientById.addMethod('PUT', integration, authOptions);

    const patientNotes = patientById.addResource('notes');
    patientNotes.addMethod('GET', integration, authOptions);

    // ─── Stack Outputs ────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL → paste into frontend/.env.local as VITE_API_URL',
      exportName: 'HealthcareCrmApiUrl',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID → VITE_COGNITO_USER_POOL_ID',
      exportName: 'HealthcareCrmUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito Client ID → VITE_COGNITO_CLIENT_ID',
      exportName: 'HealthcareCrmUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda execution role ARN',
    });

    new cdk.CfnOutput(this, 'NotesTableName', {
      value: notesTable.tableName,
      description: 'DynamoDB Notes table name',
    });

    new cdk.CfnOutput(this, 'PatientsTableName', {
      value: patientsTable.tableName,
      description: 'DynamoDB Patients table name',
    });
  }
}
