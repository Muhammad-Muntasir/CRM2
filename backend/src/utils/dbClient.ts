/**
 * dbClient.ts — Singleton DynamoDB Document Client
 *
 * This module creates and exports a single shared DynamoDB DocumentClient
 * instance used by all service functions in the backend.
 *
 * Why DocumentClient?
 *   The raw DynamoDBClient requires you to manually wrap every value in
 *   DynamoDB's type descriptors (e.g. { S: "hello" }, { N: "42" }).
 *   DynamoDBDocumentClient handles that marshalling/unmarshalling automatically,
 *   so you can work with plain JavaScript objects.
 *
 * Local development:
 *   Set the AWS_ENDPOINT environment variable to point at DynamoDB Local
 *   (e.g. http://localhost:8000) to run without a real AWS account.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// ─── Base DynamoDB Client ────────────────────────────────────────────────────
// Credentials are resolved automatically via the AWS SDK default chain:
//   1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
//   2. ~/.aws/credentials file
//   3. IAM role attached to the Lambda function (in production)
const client = new DynamoDBClient({
  // Optional: override the endpoint for local DynamoDB (DynamoDB Local)
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT,
  }),

  // Region falls back to 'us-east-1' if AWS_REGION is not set
  region: process.env.AWS_REGION || 'us-east-1',
});

// ─── Document Client Wrapper ─────────────────────────────────────────────────
// Wraps the base client with automatic JS ↔ DynamoDB type conversion.
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Do NOT silently convert empty strings — surface them as errors instead
    convertEmptyValues: false,

    // Strip undefined fields from objects before writing to DynamoDB
    // (DynamoDB rejects items that contain undefined attribute values)
    removeUndefinedValues: true,

    // Do not auto-convert class instances; only plain objects are expected
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    // Return numbers as native JS numbers rather than BigInt/Decimal wrappers
    wrapNumbers: false,
  },
});

/**
 * Shared DynamoDB DocumentClient instance.
 * Import this in service files to interact with DynamoDB.
 *
 * @example
 * import { dynamoDbClient } from '../utils/dbClient';
 * await dynamoDbClient.send(new PutCommand({ ... }));
 */
export const dynamoDbClient = docClient;
