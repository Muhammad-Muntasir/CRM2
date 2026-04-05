import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from '../services/auth.js';

// Screens: 'login' | 'signup' | 'confirm'
export default function Login({ onLogin }) {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await signIn(email, password);
      sessionStorage.setItem('crm_session', JSON.stringify(session));
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password);
      setScreen('confirm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      setScreen('login');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

        {screen === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Enter email" autoFocus required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              No account?{' '}
              <button type="button" onClick={() => { setScreen('signup'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                Sign Up
              </button>
            </p>
          </form>
        )}

        {screen === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Enter email" autoFocus required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, upper, lower, digit" required />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setScreen('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                Sign In
              </button>
            </p>
          </form>
        )}

        {screen === 'confirm' && (
          <form onSubmit={handleConfirm} className="login-form">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              A verification code was sent to <strong>{email}</strong>
            </p>
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input id="code" type="text" value={code}
                onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" autoFocus required />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Confirm Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
