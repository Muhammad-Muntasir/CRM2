/**
 * auth.ts — Extract user identity from Cognito-authorised API Gateway event.
 *
 * When API Gateway uses a Cognito Authorizer, the verified JWT claims are
 * injected into event.requestContext.authorizer.claims automatically.
 * We extract `sub` (the Cognito user UUID) as the userId.
 *
 * Falls back to x-user-id header for local development / testing.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

export function extractUserId(event: APIGatewayProxyEvent): string | null {
  // 1. Try Cognito authorizer claims (production — API Gateway injects these)
  const claims = (event.requestContext as any)?.authorizer?.claims;
  if (claims?.sub) return claims.sub as string;

  // 2. Fallback: x-user-id header (local dev / serverless-offline)
  const headers = event.headers || {};
  const userId = headers['x-user-id'] || headers['X-User-Id'];
  if (userId?.trim()) return userId.trim();

  return null;
}
