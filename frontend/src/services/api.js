/**
 * api.js — API client for Healthcare CRM backend
 * Uses Cognito idToken as Bearer token for all requests.
 */

const API_URL = import.meta.env.VITE_API_URL || '';

function getHeaders(idToken) {
  return {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getNotes(patientId, idToken) {
  return handleResponse(await fetch(`${API_URL}/patients/${patientId}/notes`, {
    headers: getHeaders(idToken),
  }));
}

export async function createNote(patientId, content, idToken) {
  return handleResponse(await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ patientId, content }),
  }));
}

export async function deleteNote(noteId, idToken) {
  return handleResponse(await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: getHeaders(idToken),
  }));
}

export async function updateNote(noteId, content, idToken) {
  return handleResponse(await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: getHeaders(idToken),
    body: JSON.stringify({ content }),
  }));
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function getPatients(idToken) {
  return handleResponse(await fetch(`${API_URL}/patients`, {
    headers: getHeaders(idToken),
  }));
}

export async function createPatient(name, idToken) {
  return handleResponse(await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ name }),
  }));
}

export async function deletePatient(patientId, idToken) {
  return handleResponse(await fetch(`${API_URL}/patients/${patientId}`, {
    method: 'DELETE',
    headers: getHeaders(idToken),
  }));
}

export async function updatePatient(patientId, name, idToken) {
  return handleResponse(await fetch(`${API_URL}/patients/${patientId}`, {
    method: 'PUT',
    headers: getHeaders(idToken),
    body: JSON.stringify({ name }),
  }));
}
