/**
 * response.ts — HTTP Response Helpers for API Gateway Lambda Handlers
 *
 * Provides two small factory functions — `success` and `error` — that build
 * properly formatted APIGatewayProxyResult objects with:
 *   - The correct HTTP status code
 *   - JSON Content-Type header
 *   - CORS headers so the React frontend (running on a different origin) can
 *     call the API without browser cross-origin errors
 *
 * Usage in a handler:
 *   return success(200, { notes: [] });
 *   return error(401, 'Unauthorized: missing x-user-id header');
 */

import { APIGatewayProxyResult } from 'aws-lambda';

// ─── Shared CORS + Content-Type headers ──────────────────────────────────────
// These headers are included on every response so the browser allows the
// frontend JavaScript to read the response body.
const COMMON_HEADERS = {
  'Content-Type': 'application/json',

  // Allow requests from any origin (suitable for demo/internal use).
  // In production, replace '*' with your specific frontend domain.
  'Access-Control-Allow-Origin': '*',

  // List the request headers the browser is allowed to send
  'Access-Control-Allow-Headers': 'Content-Type,x-user-id',

  // List the HTTP methods the browser is allowed to use
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

/**
 * Builds a successful JSON response for API Gateway.
 *
 * @param statusCode - HTTP 2xx status code (e.g. 200 OK, 201 Created)
 * @param data       - Any serialisable value; will be JSON.stringify'd into the body
 * @returns          APIGatewayProxyResult ready to be returned from a Lambda handler
 *
 * @example
 * return success(201, { noteId: 'abc-123', content: 'Follow-up required' });
 */
export function success(statusCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: COMMON_HEADERS,
    body: JSON.stringify(data),
  };
}

/**
 * Builds an error JSON response for API Gateway.
 *
 * The response body always has the shape: { "error": "<message>" }
 * so the frontend can reliably read `err.error` from the parsed JSON.
 *
 * @param statusCode - HTTP 4xx/5xx status code (e.g. 400, 401, 404, 500)
 * @param message    - Human-readable description of what went wrong
 * @returns          APIGatewayProxyResult ready to be returned from a Lambda handler
 *
 * @example
 * return error(400, 'Content cannot be empty');
 * return error(500, 'Internal server error');
 */
export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: COMMON_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}
