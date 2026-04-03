import { useState } from 'react';

// Demo credentials — replace with real auth in production
const USERS = [
  { username: 'admin', password: 'admin', displayName: 'Dr. M. Muntasir' },
  { username: 'doctor', password: 'doctor123', displayName: 'Dr. M. Muntasir' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin({ username: user.username, displayName: user.displayName });
    } else {
      setError('Invalid username or password.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🏥</span>
          <h1>Healthcare CRM</h1>
          <p>Patient Notes Management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary btn-full">
            Sign In
          </button>
        </form>

        <p className="login-hint">
          Demo: <strong>admin</strong> / <strong>admin</strong>
        </p>
      </div>
    </div>
  );
}
