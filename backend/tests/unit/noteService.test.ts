/**
 * noteService.test.ts — Unit Tests for Note Service
 *
 * Tests createNote and getNotesByPatient in isolation by mocking the
 * DynamoDB client. This means no real AWS calls are made — the tests
 * run fast and work offline.
 *
 * Mocking strategy:
 *   jest.mock() replaces the entire dbClient module with a mock object
 *   whose `send` method is a jest.fn(). Each test configures what
 *   mockSend returns via mockResolvedValueOnce().
 *
 * Run with: npm test (from the backend directory)
 */

import { createNote, getNotesByPatient } from '../../src/services/noteService';
import { dynamoDbClient } from '../../src/utils/dbClient';

jest.mock('../../src/utils/dbClient', () => ({
  dynamoDbClient: {
    send: jest.fn(),
  },
}));

const mockSend = dynamoDbClient.send as jest.Mock;

describe('noteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('should create a note and return it with generated fields', async () => {
      mockSend.mockResolvedValueOnce({});

      const note = await createNote('patient-1', 'Follow-up required', 'user-1');

      expect(note.patientId).toBe('patient-1');
      expect(note.content).toBe('Follow-up required');
      expect(note.createdBy).toBe('user-1');
      expect(note.noteId).toBeDefined();
      expect(note.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNotesByPatient', () => {
    it('should return empty array when no notes found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const notes = await getNotesByPatient('patient-1');

      expect(notes).toEqual([]);
    });

    it('should return empty array when Items is undefined', async () => {
      mockSend.mockResolvedValueOnce({});

      const notes = await getNotesByPatient('patient-1');

      expect(notes).toEqual([]);
    });

    it('should return notes sorted by createdAt descending', async () => {
      const items = [
        { noteId: 'n1', patientId: 'p1', content: 'oldest', createdAt: '2024-01-01T10:00:00.000Z', createdBy: 'u1' },
        { noteId: 'n2', patientId: 'p1', content: 'newest', createdAt: '2024-01-03T10:00:00.000Z', createdBy: 'u1' },
        { noteId: 'n3', patientId: 'p1', content: 'middle', createdAt: '2024-01-02T10:00:00.000Z', createdBy: 'u1' },
      ];
      mockSend.mockResolvedValueOnce({ Items: items });

      const notes = await getNotesByPatient('p1');

      expect(notes).toHaveLength(3);
      expect(notes[0].content).toBe('newest');
      expect(notes[1].content).toBe('middle');
      expect(notes[2].content).toBe('oldest');
    });

    it('should query using patientId-index GSI', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await getNotesByPatient('patient-42');

      const callArg = mockSend.mock.calls[0][0];
      expect(callArg.input.IndexName).toBe('patientId-index');
      expect(callArg.input.KeyConditionExpression).toBe('patientId = :patientId');
      expect(callArg.input.ExpressionAttributeValues[':patientId']).toBe('patient-42');
    });
  });
});
