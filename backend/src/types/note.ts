/**
 * note.ts — TypeScript type definitions for the Patient Notes domain
 *
 * These interfaces define the shape of data stored in DynamoDB and
 * exchanged between the Lambda handlers and the frontend.
 */

/**
 * Represents a single patient note stored in DynamoDB.
 *
 * DynamoDB table key structure:
 *   - Primary key (HASH): noteId
 *   - GSI "patientId-index" (HASH): patientId  ← used for querying notes by patient
 */
export interface Note {
  /** Unique identifier for this note (UUID v4, generated at creation time) */
  noteId: string;

  /** The patient this note belongs to (e.g. "patient-123") */
  patientId: string;

  /** The free-text body of the note written by the clinician */
  content: string;

  /** ISO 8601 timestamp of when the note was created (e.g. "2024-01-15T10:30:00.000Z") */
  createdAt: string;

  /** The user ID of the clinician who created the note (from x-user-id header) */
  createdBy: string;
}

/**
 * Shape of the JSON body expected when creating a new note.
 *
 * POST /notes body:
 * {
 *   "patientId": "patient-123",
 *   "content": "Patient reported improvement..."
 * }
 *
 * Note: patientId is also included here so the handler can read it from the body.
 */
export interface CreateNoteRequest {
  /** The patient this note is being written for */
  patientId: string;

  /** The text content of the note (max 10,000 characters) */
  content: string;
}

export interface UpdateNoteRequest {
  /** Updated text content */
  content: string;
}

/** A patient entry stored in the patients table */
export interface Patient {
  patientId: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface CreatePatientRequest {
  patientId: string;
  name: string;
}
