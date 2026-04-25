import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return setError('Fill in all fields');
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>EazyRide Admin</h1>
        <p style={styles.subtitle}>Sign in to manage the platform</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' },
  card: { background: '#1A1A1A', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,.4)' },
  title: { color: '#0A8E4E', fontSize: 28, fontWeight: 800, margin: '0 0 4px' },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 32 },
  input: { width: '100%', boxSizing: 'border-box', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: 14, fontSize: 15, color: '#FFF', marginBottom: 14, outline: 'none' },
  button: { width: '100%', background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 10, padding: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  error: { color: '#FF3B30', marginBottom: 14, textAlign: 'center', fontSize: 14 },
};
