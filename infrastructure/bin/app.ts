#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HealthcareCrmStack } from '../lib/healthcare-stack';

const app = new cdk.App();

new HealthcareCrmStack(app, 'HealthcareCrmStack', {
  env: {
    account: '467433402971',
    region: 'us-east-1',
  },
  description: 'Healthcare CRM — API Gateway + DynamoDB + Cognito',
});
