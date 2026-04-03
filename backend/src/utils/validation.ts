/**
 * validation.ts — Input Validation Utilities
 *
 * Pure functions that validate request data before it reaches the database.
 * Each function returns a ValidationResult so callers can check `isValid`
 * and surface the `error` message to the client when validation fails.
 *
 * Keeping validation separate from the handlers makes it easy to:
 *   - Unit-test validation logic in isolation
 *   - Reuse the same rules across multiple handlers
 *   - Add new rules (e.g. regex checks, length limits) in one place
 */

import { CreateNoteRequest } from '../types/note';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The result returned by every validation function.
 * If `isValid` is false, `error` contains a human-readable reason.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string; // Only present when isValid === false
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum allowed length for note content (characters) */
const MAX_CONTENT_LENGTH = 10000;

// ─── Individual Field Validators ─────────────────────────────────────────────

/**
 * Validates that note content is a non-empty string within the allowed length.
 *
 * Rules:
 *   ✓ Must be present (not null/undefined)
 *   ✓ Must be a string (not a number, array, etc.)
 *   ✓ Must not be blank (whitespace-only is rejected)
 *   ✓ Must not exceed MAX_CONTENT_LENGTH characters
 *
 * @param content - The raw value from the request body (typed as `any` because
 *                  the body is parsed from JSON and may be any type)
 * @returns ValidationResult
 *
 * @example
 * validateNoteContent('Patient doing well')  // { isValid: true }
 * validateNoteContent('')                    // { isValid: false, error: 'Content cannot be empty' }
 * validateNoteContent(null)                  // { isValid: false, error: 'Content is required' }
 */
export function validateNoteContent(content: any): ValidationResult {
  // Check presence
  if (content === undefined || content === null) {
    return { isValid: false, error: 'Content is required' };
  }

  // Check type — JSON numbers, booleans, arrays, etc. are all rejected
  if (typeof content !== 'string') {
    return { isValid: false, error: 'Content must be a string' };
  }

  // Check that it's not just whitespace
  if (content.trim().length === 0) {
    return { isValid: false, error: 'Content cannot be empty' };
  }

  // Enforce maximum length to prevent oversized DynamoDB items
  if (content.length > MAX_CONTENT_LENGTH) {
    return { isValid: false, error: `Content cannot exceed ${MAX_CONTENT_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validates that a patientId is a non-empty string.
 *
 * Rules:
 *   ✓ Must be present (not null/undefined)
 *   ✓ Must be a string
 *   ✓ Must not be blank
 *
 * @param patientId - The raw value from the request path or body
 * @returns ValidationResult
 *
 * @example
 * validatePatientId('patient-123')  // { isValid: true }
 * validatePatientId('')             // { isValid: false, error: 'Patient ID cannot be empty' }
 */
export function validatePatientId(patientId: any): ValidationResult {
  if (patientId === undefined || patientId === null) {
    return { isValid: false, error: 'Patient ID is required' };
  }

  if (typeof patientId !== 'string') {
    return { isValid: false, error: 'Patient ID must be a string' };
  }

  if (patientId.trim().length === 0) {
    return { isValid: false, error: 'Patient ID cannot be empty' };
  }

  return { isValid: true };
}

// ─── Composite Validator ──────────────────────────────────────────────────────

/**
 * Validates a full CreateNote request (patientId + content).
 *
 * Validates patientId first; if that fails, returns immediately without
 * checking content (fail-fast approach — one error at a time).
 *
 * @param patientId - The patientId value (from request body or path params)
 * @param body      - The parsed request body (may be null if body was empty)
 * @returns ValidationResult — the first validation failure found, or { isValid: true }
 *
 * @example
 * // Both valid
 * validateCreateNoteRequest('patient-1', { content: 'Note text' })
 * // → { isValid: true }
 *
 * // Missing content
 * validateCreateNoteRequest('patient-1', {})
 * // → { isValid: false, error: 'Content is required' }
 */
export function validateCreateNoteRequest(
  patientId: any,
  body: Partial<CreateNoteRequest> | null | undefined
): ValidationResult {
  // Validate patientId first
  const patientIdResult = validatePatientId(patientId);
  if (!patientIdResult.isValid) {
    return patientIdResult;
  }

  // Then validate content from the request body
  const content = body?.content;
  return validateNoteContent(content);
}
