/**
 * auth.test.ts — Unit Tests for Authentication Middleware
 *
 * Tests every branch of extractUserId to ensure the x-user-id header
 * is correctly extracted, trimmed, and rejected when missing or blank.
 *
 * Run with: npm test (from the backend directory)
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractUserId } from '../../src/utils/auth';

function makeEvent(headers: Record<string, string>): APIGatewayProxyEvent {
  return {
    headers,
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    body: null,
  };
}

describe('Auth Middleware - extractUserId', () => {
  it('should return userId when x-user-id header is present', () => {
    const event = makeEvent({ 'x-user-id': 'user-123' });
    expect(extractUserId(event)).toBe('user-123');
  });

  it('should return userId when X-User-Id header is present (original casing)', () => {
    const event = makeEvent({ 'X-User-Id': 'user-456' });
    expect(extractUserId(event)).toBe('user-456');
  });

  it('should return null when x-user-id header is missing', () => {
    const event = makeEvent({});
    expect(extractUserId(event)).toBeNull();
  });

  it('should return null when x-user-id header is empty string', () => {
    const event = makeEvent({ 'x-user-id': '' });
    expect(extractUserId(event)).toBeNull();
  });

  it('should return null when x-user-id header is whitespace only', () => {
    const event = makeEvent({ 'x-user-id': '   ' });
    expect(extractUserId(event)).toBeNull();
  });

  it('should trim whitespace from userId', () => {
    const event = makeEvent({ 'x-user-id': '  user-789  ' });
    expect(extractUserId(event)).toBe('user-789');
  });

  it('should return null when headers object is missing', () => {
    const event = makeEvent({});
    (event as any).headers = null;
    expect(extractUserId(event)).toBeNull();
  });
});
