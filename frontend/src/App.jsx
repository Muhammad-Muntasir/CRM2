import { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(userData) {
    sessionStorage.setItem('crm_user', JSON.stringify(userData));
    setUser(userData);
  }

  function handleLogout() {
    sessionStorage.removeItem('crm_user');
    setUser(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
