import { useState } from 'react';

export default function Sidebar({ patients, selectedId, onSelect, onAddPatient, onDeletePatient, loading, user, onLogout }) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const filtered = patients.filter(p =>
    p.patientId.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) { setAddError('Patient name is required.'); return; }
    setAdding(true);
    setAddError('');
    try {
      await onAddPatient(newName.trim());
      setNewName('');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message || 'Failed to add patient.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-logo">🏥</span>
        <span className="sidebar-title">CRM</span>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <span className="sidebar-user-avatar">{(user.email || user.displayName || 'U')[0].toUpperCase()}</span>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.email || user.displayName}</span>
          <span className="sidebar-user-role">Clinician</span>
        </div>
        <button className="btn-icon" onClick={onLogout} title="Sign out">⏻</button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Patient list */}
      <div className="sidebar-patients">
        <div className="sidebar-section-label">
          Patients
          <button className="btn-icon-sm" onClick={() => setShowAddForm(v => !v)} title="Add patient">+</button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="add-patient-form">
            <input
              type="text"
              placeholder="Patient full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            {addError && <p className="form-error">{addError}</p>}
            <div className="add-patient-actions">
              <button type="submit" className="btn-primary btn-sm" disabled={adding}>
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => { setShowAddForm(false); setNewName(''); setAddError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="sidebar-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="sidebar-empty">{search ? 'No results.' : 'No patients yet.'}</p>
        ) : (
          <ul className="patient-list">
            {filtered.map(p => (
              <li
                key={p.patientId}
                className={`patient-item ${selectedId === p.patientId ? 'active' : ''}`}
              >
                <button className="patient-item-btn" onClick={() => onSelect(p)}>
                  <span className="patient-avatar">{p.name[0].toUpperCase()}</span>
                  <div className="patient-info">
                    <span className="patient-name">{p.name}</span>
                    <span className="patient-id">{p.patientId}</span>
                  </div>
                </button>
                <button
                  className="btn-icon-danger"
                  onClick={() => onDeletePatient(p.patientId)}
                  title="Delete patient"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
