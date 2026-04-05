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
      runtime: lambda.Runtime.NODEJS_18_X,
      role: lambdaRole,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      code: backendCode,
    };

    // Helper to create a log group with 1-week retention per function
    const logGroup = (name: string) =>
      new logs.LogGroup(this, `${name}LogGroup`, {
        logGroupName: `/aws/lambda/healthcare-crm-${name}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

    // ─── Lambda Functions ─────────────────────────────────────────────────────

    const createNoteFunc = new lambda.Function(this, 'CreateNoteFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-createNote',
      handler: 'dist/src/handlers/notes.createNoteHandler',
      description: 'POST /notes — create a patient note',
      logGroup: logGroup('createNote'),
    });

    const getNotesFunc = new lambda.Function(this, 'GetNotesFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-getNotes',
      handler: 'dist/src/handlers/notes.getNotesHandler',
      description: 'GET /patients/{patientId}/notes',
      logGroup: logGroup('getNotes'),
    });

    const updateNoteFunc = new lambda.Function(this, 'UpdateNoteFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-updateNote',
      handler: 'dist/src/handlers/notes.updateNoteHandler',
      description: 'PUT /notes/{noteId}',
      logGroup: logGroup('updateNote'),
    });

    const deleteNoteFunc = new lambda.Function(this, 'DeleteNoteFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-deleteNote',
      handler: 'dist/src/handlers/notes.deleteNoteHandler',
      description: 'DELETE /notes/{noteId}',
      logGroup: logGroup('deleteNote'),
    });

    const listPatientsFunc = new lambda.Function(this, 'ListPatientsFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-listPatients',
      handler: 'dist/src/handlers/patients.listHandler',
      description: 'GET /patients',
      logGroup: logGroup('listPatients'),
    });

    const createPatientFunc = new lambda.Function(this, 'CreatePatientFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-createPatient',
      handler: 'dist/src/handlers/patients.createHandler',
      description: 'POST /patients',
      logGroup: logGroup('createPatient'),
    });

    const deletePatientFunc = new lambda.Function(this, 'DeletePatientFunc', {
      ...lambdaDefaults,
      functionName: 'healthcare-crm-deletePatient',
      handler: 'dist/src/handlers/patients.deleteHandler',
      description: 'DELETE /patients/{patientId}',
      logGroup: logGroup('deletePatient'),
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

    // /notes
    const notes = api.root.addResource('notes');
    notes.addMethod('POST', new apigateway.LambdaIntegration(createNoteFunc), authOptions);

    const noteById = notes.addResource('{noteId}');
    noteById.addMethod('PUT', new apigateway.LambdaIntegration(updateNoteFunc), authOptions);
    noteById.addMethod('DELETE', new apigateway.LambdaIntegration(deleteNoteFunc), authOptions);

    // /patients
    const patients = api.root.addResource('patients');
    patients.addMethod('GET', new apigateway.LambdaIntegration(listPatientsFunc), authOptions);
    patients.addMethod('POST', new apigateway.LambdaIntegration(createPatientFunc), authOptions);

    const patientById = patients.addResource('{patientId}');
    patientById.addMethod('DELETE', new apigateway.LambdaIntegration(deletePatientFunc), authOptions);

    const patientNotes = patientById.addResource('notes');
    patientNotes.addMethod('GET', new apigateway.LambdaIntegration(getNotesFunc), authOptions);

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
