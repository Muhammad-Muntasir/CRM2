/**
 * notes.ts — Parent handler file for all Note API endpoints
 *
 * All note-related Lambda handlers live here. Any future note endpoints
 * (e.g. search, bulk-delete) should be added as named exports in this file.
 *
 * Exports:
 *   createNoteHandler  → POST /notes
 *   getNotesHandler    → GET  /patients/{patientId}/notes
 *   updateNoteHandler  → PUT  /notes/{noteId}
 *   deleteNoteHandler  → DELETE /notes/{noteId}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractUserId } from '../utils/auth';
import { validateCreateNoteRequest } from '../utils/validation';
import { createNote, getNotesByPatient, updateNote, deleteNote } from '../services/noteService';
import { success, error } from '../utils/response';

// ─── POST /notes ──────────────────────────────────────────────────────────────

/**
 * Creates a new patient note.
 * Body: { patientId, content }
 * Returns 201 with the created Note object.
 */
export async function createNoteHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized: missing x-user-id header');

    let body: { patientId?: string; content?: string } | null = null;
    try { body = event.body ? JSON.parse(event.body) : null; }
    catch { return error(400, 'Invalid JSON in request body'); }

    const patientId = body?.patientId;
    const validation = validateCreateNoteRequest(patientId, body);
    if (!validation.isValid) return error(400, validation.error || 'Invalid request');

    const note = await createNote(patientId as string, body!.content as string, userId);
    return success(201, note);
  } catch (err) {
    console.error('createNoteHandler error:', err);
    return error(500, 'Internal server error');
  }
}

// ─── GET /patients/{patientId}/notes ─────────────────────────────────────────

/**
 * Returns all notes for a patient, sorted newest-first.
 * Returns 200 with a Note array (empty array if none exist).
 */
export async function getNotesHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized: missing x-user-id header');

    const patientId = event.pathParameters?.patientId;
    if (!patientId?.trim()) return error(400, 'Patient ID is required');

    const notes = await getNotesByPatient(patientId);
    return success(200, notes);
  } catch (err) {
    console.error('getNotesHandler error:', err);
    return error(500, 'Internal server error');
  }
}

// ─── PUT /notes/{noteId} ──────────────────────────────────────────────────────

/**
 * Updates the content of an existing note.
 * Body: { content }
 * Returns 200 with the updated Note object.
 */
export async function updateNoteHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized: missing x-user-id header');

    const noteId = event.pathParameters?.noteId;
    if (!noteId) return error(400, 'noteId is required');

    let body: { content?: string } | null = null;
    try { body = event.body ? JSON.parse(event.body) : null; }
    catch { return error(400, 'Invalid JSON in request body'); }

    const content = body?.content?.trim();
    if (!content) return error(400, 'content is required');

    const updated = await updateNote(noteId, content);
    if (!updated) return error(404, 'Note not found');
    return success(200, updated);
  } catch (err) {
    console.error('updateNoteHandler error:', err);
    return error(500, 'Internal server error');
  }
}

// ─── DELETE /notes/{noteId} ───────────────────────────────────────────────────

/**
 * Deletes a single note by noteId.
 * Returns 200 with a confirmation message.
 */
export async function deleteNoteHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized: missing x-user-id header');

    const noteId = event.pathParameters?.noteId;
    if (!noteId) return error(400, 'noteId is required');

    await deleteNote(noteId);
    return success(200, { message: 'Note deleted' });
  } catch (err) {
    console.error('deleteNoteHandler error:', err);
    return error(500, 'Internal server error');
  }
}
