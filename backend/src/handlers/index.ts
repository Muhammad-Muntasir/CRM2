/**
 * index.ts — Single Lambda Handler
 *
 * One Lambda function handles ALL API routes.
 * Routes requests based on HTTP method + path pattern.
 *
 * Routes:
 *   GET    /patients                        → list patients
 *   POST   /patients                        → create patient
 *   PUT    /patients/{patientId}            → update patient name
 *   DELETE /patients/{patientId}            → delete patient
 *   GET    /patients/{patientId}/notes      → get notes for patient
 *   POST   /notes                           → create note
 *   PUT    /notes/{noteId}                  → update note
 *   DELETE /notes/{noteId}                  → delete note
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractUserId } from '../utils/auth';
import { validateCreateNoteRequest } from '../utils/validation';
import {
  createNote, getNotesByPatient, updateNote, deleteNote,
  createPatient, getAllPatients, deletePatient, updatePatient,
} from '../services/noteService';
import { success, error } from '../utils/response';
import { randomUUID } from 'crypto';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.resource; // e.g. /patients/{patientId}/notes

  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized');

    // ─── Patients ────────────────────────────────────────────────────────────

    // GET /patients
    if (method === 'GET' && path === '/patients') {
      const patients = await getAllPatients();
      return success(200, patients);
    }

    // POST /patients
    if (method === 'POST' && path === '/patients') {
      const body = parseBody(event.body);
      const name = body?.name?.trim();
      if (!name) return error(400, 'name is required');
      const patientId = `P-${randomUUID().split('-')[0].toUpperCase()}`;
      const patient = await createPatient(patientId, name, userId);
      return success(201, patient);
    }

    // PUT /patients/{patientId}
    if (method === 'PUT' && path === '/patients/{patientId}') {
      const patientId = event.pathParameters?.patientId;
      if (!patientId) return error(400, 'patientId is required');
      const body = parseBody(event.body);
      const name = body?.name?.trim();
      if (!name) return error(400, 'name is required');
      const updated = await updatePatient(patientId, name);
      if (!updated) return error(404, 'Patient not found');
      return success(200, updated);
    }

    // DELETE /patients/{patientId}
    if (method === 'DELETE' && path === '/patients/{patientId}') {
      const patientId = event.pathParameters?.patientId;
      if (!patientId) return error(400, 'patientId is required');
      await deletePatient(patientId);
      return success(200, { message: 'Patient and all notes deleted' });
    }

    // ─── Notes ───────────────────────────────────────────────────────────────

    // GET /patients/{patientId}/notes
    if (method === 'GET' && path === '/patients/{patientId}/notes') {
      const patientId = event.pathParameters?.patientId;
      if (!patientId) return error(400, 'patientId is required');
      const notes = await getNotesByPatient(patientId);
      return success(200, notes);
    }

    // POST /notes
    if (method === 'POST' && path === '/notes') {
      const body = parseBody(event.body);
      const patientId = body?.patientId;
      const validation = validateCreateNoteRequest(patientId, body);
      if (!validation.isValid) return error(400, validation.error || 'Invalid request');
      const note = await createNote(patientId, body!.content, userId);
      return success(201, note);
    }

    // PUT /notes/{noteId}
    if (method === 'PUT' && path === '/notes/{noteId}') {
      const noteId = event.pathParameters?.noteId;
      if (!noteId) return error(400, 'noteId is required');
      const body = parseBody(event.body);
      const content = body?.content?.trim();
      if (!content) return error(400, 'content is required');
      const updated = await updateNote(noteId, content);
      if (!updated) return error(404, 'Note not found');
      return success(200, updated);
    }

    // DELETE /notes/{noteId}
    if (method === 'DELETE' && path === '/notes/{noteId}') {
      const noteId = event.pathParameters?.noteId;
      if (!noteId) return error(400, 'noteId is required');
      await deleteNote(noteId);
      return success(200, { message: 'Note deleted' });
    }

    return error(404, 'Route not found');
  } catch (err) {
    console.error('handler error:', err);
    return error(500, 'Internal server error');
  }
}

function parseBody(body: string | null): any {
  try { return body ? JSON.parse(body) : null; }
  catch { return null; }
}
