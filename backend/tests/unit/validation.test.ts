/**
 * validation.test.ts — Unit Tests for Input Validation Utilities
 *
 * Tests every branch of validateNoteContent and validatePatientId to ensure
 * the validation rules are enforced correctly before data reaches DynamoDB.
 *
 * Run with: npm test (from the backend directory)
 */

import { validateNoteContent, validatePatientId } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateNoteContent', () => {
    it('should return valid for non-empty string content', () => {
      const result = validateNoteContent('This is a valid note');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty string', () => {
      const result = validateNoteContent('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content cannot be empty');
    });

    it('should return invalid for whitespace-only string', () => {
      const result = validateNoteContent('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content cannot be empty');
    });

    it('should return invalid for null', () => {
      const result = validateNoteContent(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content is required');
    });

    it('should return invalid for undefined', () => {
      const result = validateNoteContent(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content is required');
    });

    it('should return invalid for non-string types', () => {
      const result = validateNoteContent(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content must be a string');
    });
  });

  describe('validatePatientId', () => {
    it('should return valid for non-empty string patientId', () => {
      const result = validatePatientId('patient-123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty string', () => {
      const result = validatePatientId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Patient ID cannot be empty');
    });

    it('should return invalid for whitespace-only string', () => {
      const result = validatePatientId('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Patient ID cannot be empty');
    });

    it('should return invalid for null', () => {
      const result = validatePatientId(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Patient ID is required');
    });

    it('should return invalid for undefined', () => {
      const result = validatePatientId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Patient ID is required');
    });

    it('should return invalid for non-string types', () => {
      const result = validatePatientId(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Patient ID must be a string');
    });
  });
});
