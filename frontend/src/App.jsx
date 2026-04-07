/**
 * App.jsx — Root Component
 *
 * This is the entry point of the React app. It has one job:
 * decide whether to show the Login screen or the Dashboard
 * based on whether the user is authenticated.
 *
 * Auth state:
 *   - On load, checks sessionStorage for a saved session so the user
 *     stays logged in after a page refresh (until the tab is closed).
 *   - After login, stores the Cognito session (idToken, email, etc.)
 *     in state and sessionStorage.
 *   - After logout, clears both state and sessionStorage.
 *
 * Routing logic (no router library needed — just two states):
 *   user === null  →  show <Login />
 *   user !== null  →  show <Dashboard />
 */

import { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import { signOut } from './services/auth.js';

export default function App() {
  // user holds the Cognito session object: { idToken, email, ... }
  // Initialised from sessionStorage so refresh doesn't log the user out
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('crm_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Called by Login component after successful Cognito authentication
  function handleLogin(session) {
    setUser(session);
  }

  // Called by Dashboard when the user clicks Sign Out
  // signOut() clears the Cognito token from sessionStorage
  function handleLogout() {
    signOut();
    setUser(null);
  }

  // If no user session exists, show the login screen
  if (!user) return <Login onLogin={handleLogin} />;

  // Otherwise show the main dashboard, passing user session and logout handler
  return <Dashboard user={user} onLogout={handleLogout} />;
}
