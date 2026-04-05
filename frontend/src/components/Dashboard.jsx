import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import NoteForm from './NoteForm.jsx';
import NotesList from './NotesList.jsx';
import { getNotes, getPatients, createPatient, deletePatient } from '../services/api.js';

export default function Dashboard({ user, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);

  // Load patients on mount
  useEffect(() => {
    setPatientsLoading(true);
    getPatients(user.idToken)
      .then(setPatients)
      .catch(() => {})
      .finally(() => setPatientsLoading(false));
  }, [user.idToken]);

  // Load notes when selected patient changes
  useEffect(() => {
    if (!selectedPatient) { setNotes([]); return; }
    setNotesLoading(true);
    setNotesError(null);
    getNotes(selectedPatient.patientId, user.idToken)
      .then(setNotes)
      .catch(err => setNotesError(err.message || 'Failed to load notes.'))
      .finally(() => setNotesLoading(false));
  }, [selectedPatient, user.idToken]);

  async function handleAddPatient(name) {
    const patient = await createPatient(name, user.idToken);
    setPatients(prev => [...prev, patient].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleDeletePatient(patientId) {
    if (!window.confirm('Delete this patient and ALL their notes? This cannot be undone.')) return;
    try {
      await deletePatient(patientId, user.idToken);
      setPatients(prev => prev.filter(p => p.patientId !== patientId));
      if (selectedPatient?.patientId === patientId) {
        setSelectedPatient(null);
        setNotes([]);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete patient.');
    }
  }

  return (
    <div className="dashboard">
      <Sidebar
        patients={patients}
        selectedId={selectedPatient?.patientId}
        onSelect={setSelectedPatient}
        onAddPatient={handleAddPatient}
        onDeletePatient={handleDeletePatient}
        loading={patientsLoading}
        user={user}
        onLogout={onLogout}
      />

      <main className="main-content">
        {!selectedPatient ? (
          <div className="empty-state">
            <span className="empty-icon">👈</span>
            <h2>Select a patient</h2>
            <p>Choose a patient from the sidebar to view and manage their notes.</p>
          </div>
        ) : (
          <>
            <div className="content-header">
              <div>
                <h2 className="patient-title">{selectedPatient.name}</h2>
                <span className="patient-id-badge">{selectedPatient.patientId}</span>
              </div>
            </div>

            <NoteForm
              patientId={selectedPatient.patientId}
              userId={user.idToken}
              onNoteCreated={note => setNotes(prev => [note, ...prev])}
            />

            <div className="notes-section">
              <h3 className="notes-heading">
                Notes
                {notes.length > 0 && <span className="notes-count">{notes.length}</span>}
              </h3>
              <NotesList
                notes={notes}
                loading={notesLoading}
                error={notesError}
                userId={user.idToken}
                onNotesChange={setNotes}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
