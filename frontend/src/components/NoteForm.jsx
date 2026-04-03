import { useState } from 'react';
import { createNote } from '../services/api.js';

export default function NoteForm({ patientId, userId, onNoteCreated }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) { setError('Note content cannot be empty.'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const newNote = await createNote(patientId, content.trim(), userId);
      setContent('');
      onNoteCreated(newNote);
    } catch (err) {
      setError(err.message || 'Failed to create note.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write a clinical note..."
        rows={3}
        disabled={isSubmitting}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : '+ Add Note'}
      </button>
    </form>
  );
}
