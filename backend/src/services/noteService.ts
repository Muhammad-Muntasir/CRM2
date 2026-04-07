/**
 * noteService.ts — Business Logic for Patient Notes
 *
 * This module contains the core data-access functions for creating and
 * retrieving patient notes from DynamoDB. Handlers call these functions
 * after validating the request; the service layer does not do validation.
 *
 * DynamoDB table design:
 *   Table name : <service>-notes-<stage>  (set via NOTES_TABLE env var)
 *   Primary key: noteId (String, HASH)    — unique per note
 *   GSI        : patientId-index          — allows querying all notes for a patient
 *     GSI key  : patientId (String, HASH)
 */

import { PutCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto'; // Node.js built-in — no extra dependency needed
import { dynamoDbClient } from '../utils/dbClient';
import { Note, Patient } from '../types/note';

const TABLE_NAME = process.env.NOTES_TABLE || 'notes';
const PATIENTS_TABLE = process.env.PATIENTS_TABLE || 'patients';

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Creates a new patient note and persists it to DynamoDB.
 *
 * Steps:
 *   1. Build a Note object with a generated UUID and current timestamp
 *   2. Write it to DynamoDB with PutCommand
 *   3. Return the created note (so the handler can send it back to the client)
 *
 * @param patientId - The patient this note belongs to
 * @param content   - The text body of the note
 * @param authorId  - The user ID of the clinician creating the note (from x-user-id header)
 * @returns         The newly created Note object (same data that was written to DynamoDB)
 *
 * @throws Will throw if the DynamoDB write fails (e.g. network error, permissions issue)
 *
 * @example
 * const note = await createNote('patient-123', 'Follow-up required', 'dr-smith');
 * // note.noteId  → 'a1b2c3d4-...'  (UUID)
 * // note.createdAt → '2024-01-15T10:30:00.000Z'
 */
export async function createNote(
  patientId: string,
  content: string,
  authorId: string
): Promise<Note> {
  // Build the note object that will be stored in DynamoDB
  const note: Note = {
    noteId: randomUUID(),              // Globally unique ID for this note
    patientId,                         // Links the note to a patient
    content,                           // The actual note text
    createdAt: new Date().toISOString(), // ISO timestamp for sorting
    createdBy: authorId,               // Audit trail — who wrote this note
  };

  // Write the note to DynamoDB
  // PutCommand creates a new item or replaces an existing one with the same key.
  // Since noteId is a UUID, collisions are astronomically unlikely.
  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: note, // DocumentClient automatically marshals the JS object to DynamoDB format
    })
  );

  // Return the note so the handler can include it in the HTTP 201 response
  return note;
}

/**
 * Retrieves all notes for a given patient, sorted newest-first.
 *
 * Uses the `patientId-index` Global Secondary Index (GSI) to efficiently
 * query all notes belonging to a patient without scanning the entire table.
 *
 * Sorting:
 *   DynamoDB does not guarantee order within a GSI partition, so we sort
 *   the results in application code by comparing ISO timestamp strings
 *   (lexicographic comparison works correctly for ISO 8601 dates).
 *
 * @param patientId - The patient whose notes to retrieve
 * @returns         Array of Note objects sorted by createdAt descending (newest first).
 *                  Returns an empty array if the patient has no notes.
 *
 * @throws Will throw if the DynamoDB query fails
 *
 * @example
 * const notes = await getNotesByPatient('patient-123');
 * // notes[0] is the most recently created note
 */
export async function getNotesByPatient(patientId: string): Promise<Note[]> {
  // Query the GSI for all notes where patientId matches
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,

      // Use the GSI instead of the primary key index
      IndexName: 'patientId-index',

      // KeyConditionExpression filters by the GSI partition key
      // We use an expression attribute value (:patientId) to avoid
      // conflicts with DynamoDB reserved words
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': patientId,
      },
    })
  );

  // result.Items may be undefined if no items were found — default to []
  const notes = (result.Items ?? []) as Note[];

  // Sort newest-first: b.createdAt > a.createdAt means b comes first
  // ISO 8601 strings sort correctly with plain string comparison
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Delete a single note by noteId */
export async function deleteNote(noteId: string): Promise<void> {
  await dynamoDbClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { noteId } })
  );
}

/** Update the content of an existing note */
export async function updateNote(noteId: string, content: string): Promise<Note | null> {
  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { noteId },
      UpdateExpression: 'SET #content = :content',
      ExpressionAttributeNames: { '#content': 'content' },
      ExpressionAttributeValues: { ':content': content },
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as Note) ?? null;
}

/** Delete all notes for a patient (used when deleting a patient) */
export async function deletePatientNotes(patientId: string): Promise<void> {
  const notes = await getNotesByPatient(patientId);
  for (const note of notes) {
    await deleteNote(note.noteId);
  }
}

// ─── Patient CRUD ─────────────────────────────────────────────────────────────

export async function createPatient(patientId: string, name: string, authorId: string): Promise<Patient> {
  const patient: Patient = {
    patientId,
    name,
    createdAt: new Date().toISOString(),
    createdBy: authorId,
  };
  await dynamoDbClient.send(new PutCommand({ TableName: PATIENTS_TABLE, Item: patient }));
  return patient;
}

export async function getAllPatients(): Promise<Patient[]> {
  const result = await dynamoDbClient.send(new ScanCommand({ TableName: PATIENTS_TABLE }));
  const patients = (result.Items ?? []) as Patient[];
  return patients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function deletePatient(patientId: string): Promise<void> {
  await deletePatientNotes(patientId);
  await dynamoDbClient.send(new DeleteCommand({ TableName: PATIENTS_TABLE, Key: { patientId } }));
}

export async function updatePatient(patientId: string, name: string): Promise<Patient | null> {
  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: PATIENTS_TABLE,
      Key: { patientId },
      UpdateExpression: 'SET #name = :name',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: { ':name': name },
      ConditionExpression: 'attribute_exists(patientId)',
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as Patient) ?? null;
}
