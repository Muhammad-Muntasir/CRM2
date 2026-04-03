import { useState } from 'react';
import { updateNote, deleteNote } from '../services/api.js';

export default function NotesList({ notes, loading, error, userId, onNotesChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  if (loading) return <div className="notes-empty">Loading notes...</div>;
  if (error) return <div className="notes-error">⚠ {error}</div>;
  if (!notes || notes.length === 0) return <div className="notes-empty">No notes yet. Add the first one above.</div>;

  function startEdit(note) {
    setEditingId(note.noteId);
    setEditContent(note.content);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
    setEditError('');
  }

  async function handleSave(noteId) {
    if (!editContent.trim()) { setEditError('Content cannot be empty.'); return; }
    setSaving(true);
    setEditError('');
    try {
      const updated = await updateNote(noteId, editContent.trim(), userId);
      onNotesChange(prev => prev.map(n => n.noteId === noteId ? updated : n));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId) {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteNote(noteId, userId);
      onNotesChange(prev => prev.filter(n => n.noteId !== noteId));
    } catch (err) {
      alert(err.message || 'Failed to delete note.');
    }
  }

  return (
    <ul className="notes-list">
      {notes.map(note => (
        <li key={note.noteId} className="note-card">
          {editingId === note.noteId ? (
            <div className="note-edit">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                disabled={saving}
              />
              {editError && <p className="form-error">{editError}</p>}
              <div className="note-edit-actions">
                <button className="btn-primary btn-sm" onClick={() => handleSave(note.noteId)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="note-content">{note.content}</p>
              <div className="note-footer">
                <small className="note-meta">
                  {new Date(note.createdAt).toLocaleString()} &mdash; {note.createdBy}
                </small>
                <div className="note-actions">
                  <button className="btn-icon-sm" onClick={() => startEdit(note)} title="Edit">✏️</button>
                  <button className="btn-icon-danger-sm" onClick={() => handleDelete(note.noteId)} title="Delete">🗑</button>
                </div>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
