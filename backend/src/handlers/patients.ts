/**
 * patients.ts — Parent handler file for all Patient API endpoints
 *
 * All patient-related Lambda handlers live here. Any future patient endpoints
 * should be added as named exports in this file.
 *
 * Exports:
 *   listHandler    → GET    /patients
 *   createHandler  → POST   /patients  (auto-generates patientId UUID)
 *   deleteHandler  → DELETE /patients/{patientId}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { extractUserId } from '../utils/auth';
import { createPatient, getAllPatients, deletePatient } from '../services/noteService';
import { success, error } from '../utils/response';

// ─── GET /patients ────────────────────────────────────────────────────────────

/**
 * Returns all patients sorted alphabetically by name.
 */
export async function listHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized');

    const patients = await getAllPatients();
    return success(200, patients);
  } catch (err) {
    console.error('listHandler error:', err);
    return error(500, 'Internal server error');
  }
}

// ─── POST /patients ───────────────────────────────────────────────────────────

/**
 * Creates a new patient.
 * Body: { name }  — patientId is auto-generated as a UUID (user does NOT provide it)
 * Returns 201 with the created Patient object including the generated patientId.
 */
export async function createHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized');

    let body: { name?: string } | null = null;
    try { body = event.body ? JSON.parse(event.body) : null; }
    catch { return error(400, 'Invalid JSON in request body'); }

    const name = body?.name?.trim();
    if (!name) return error(400, 'name is required');

    // Auto-generate a short, readable patient ID: "P-" + first 8 chars of UUID
    const patientId = `P-${randomUUID().split('-')[0].toUpperCase()}`;

    const patient = await createPatient(patientId, name, userId);
    return success(201, patient);
  } catch (err) {
    console.error('createHandler error:', err);
    return error(500, 'Internal server error');
  }
}

// ─── DELETE /patients/{patientId} ─────────────────────────────────────────────

/**
 * Deletes a patient and ALL their notes (cascading delete).
 * Returns 200 with a confirmation message.
 */
export async function deleteHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = extractUserId(event);
    if (!userId) return error(401, 'Unauthorized');

    const patientId = event.pathParameters?.patientId;
    if (!patientId) return error(400, 'patientId is required');

    await deletePatient(patientId);
    return success(200, { message: 'Patient and all notes deleted' });
  } catch (err) {
    console.error('deleteHandler error:', err);
    return error(500, 'Internal server error');
  }
}
