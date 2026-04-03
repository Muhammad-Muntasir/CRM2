const API_URL = import.meta.env.VITE_API_URL || '';

function getHeaders(userId) {
  return {
    'x-user-id': userId,
    'Content-Type': 'application/json',
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getNotes(patientId, userId) {
  return handleResponse(await fetch(`${API_URL}/patients/${patientId}/notes`, {
    headers: { 'x-user-id': userId },
  }));
}

export async function createNote(patientId, content, userId) {
  return handleResponse(await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ patientId, content }),
  }));
}

export async function deleteNote(noteId, userId) {
  return handleResponse(await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  }));
}

export async function updateNote(noteId, content, userId) {
  return handleResponse(await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: getHeaders(userId),
    body: JSON.stringify({ content }),
  }));
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function getPatients(userId) {
  return handleResponse(await fetch(`${API_URL}/patients`, {
    headers: { 'x-user-id': userId },
  }));
}

export async function createPatient(name, userId) {
  return handleResponse(await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ name }),
  }));
}

export async function deletePatient(patientId, userId) {
  return handleResponse(await fetch(`${API_URL}/patients/${patientId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  }));
}
