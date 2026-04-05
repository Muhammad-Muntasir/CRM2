import { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import { signOut } from './services/auth.js';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('crm_session');
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(session) {
    setUser(session);
  }

  function handleLogout() {
    signOut();
    setUser(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
