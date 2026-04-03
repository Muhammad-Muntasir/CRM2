/**
 * auth.ts — Authentication Middleware
 *
 * Extracts and validates the caller's identity from the incoming HTTP request.
 *
 * How authentication works in this app:
 *   Every API request must include a custom header:
 *     x-user-id: <some-user-identifier>
 *
 *   The Lambda handler calls extractUserId() first. If the header is missing
 *   or blank, the handler returns a 401 Unauthorized response immediately.
 *   Otherwise, the returned userId is stored as `createdBy` on each note.
 *
 * Why x-user-id instead of JWT / Cognito?
 *   This is a demo/internal application. For production systems you should
 *   replace this with a proper auth layer such as:
 *     - AWS Cognito Authorizer on the API Gateway
 *     - A JWT verified with a public key (e.g. using the `jose` library)
 *     - OAuth 2.0 / OpenID Connect
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Extracts the user identifier from the `x-user-id` request header.
 *
 * API Gateway normalises all header names to lowercase before passing them
 * to the Lambda function, so we check both `x-user-id` (normalised) and
 * `X-User-Id` (original casing) for safety.
 *
 * @param event - The API Gateway proxy event containing the request headers
 * @returns     The trimmed user ID string if the header is present and non-empty,
 *              or `null` if the header is absent, empty, or whitespace-only
 *
 * @example
 * // In a Lambda handler:
 * const userId = extractUserId(event);
 * if (!userId) {
 *   return error(401, 'Unauthorized: missing x-user-id header');
 * }
 * // userId is now a non-empty string, safe to use
 */
export function extractUserId(event: APIGatewayProxyEvent): string | null {
  // Guard against a null/undefined headers object (can happen in unit tests)
  const headers = event.headers || {};

  // Try lowercase first (API Gateway normalises headers), then original casing
  const userId = headers['x-user-id'] || headers['X-User-Id'];

  // Reject missing, empty, or whitespace-only values
  if (userId && userId.trim().length > 0) {
    return userId.trim(); // Remove any accidental leading/trailing whitespace
  }

  return null; // Signal to the caller that authentication failed
}
