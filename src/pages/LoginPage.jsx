import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

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

  const togglePassword = () => {
    setShowPassword(!showPassword);
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🚕</span>
          <h1 style={styles.title}>EazyRide</h1>
          <p style={styles.brand}>Haye!</p>
        </div>
        <p style={styles.subtitle}>Sign in to manage the platform</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email or Phone</label>
            <input
              style={styles.input}
              placeholder="admin@eazyride.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={togglePassword}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={styles.footer}>
          <span style={styles.footerText}>EazyRide Admin Panel v2.0</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F0F0F 0%, #1a1a2e 100%)' },
  card: { background: '#1A1A1A', borderRadius: 20, padding: 48, width: 420, boxShadow: '0 8px 32px rgba(0,0,0,.5)', border: '1px solid #2A2A2A' },
  logoContainer: { textAlign: 'center', marginBottom: 8 },
  logoIcon: { fontSize: 48 },
  title: { color: '#0A8E4E', fontSize: 32, fontWeight: 800, margin: '0 0 0', letterSpacing: -1 },
  brand: { color: '#FF6B35', fontSize: 18, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 28, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { display: 'block', color: '#AAA', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', boxSizing: 'border-box', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: '14px 16px', fontSize: 15, color: '#FFF', outline: 'none', transition: 'border-color .2s' },
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  passwordInput: { width: '100%', boxSizing: 'border-box', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: '14px 48px 14px 16px', fontSize: 15, color: '#FFF', outline: 'none', transition: 'border-color .2s' },
  eyeBtn: { position: 'absolute', right: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '8px 12px', color: '#AAA' },
  button: { width: '100%', background: 'linear-gradient(135deg, #0A8E4E 0%, #0DBF65 100%)', color: '#FFF', border: 'none', borderRadius: 10, padding: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8, transition: 'opacity .2s' },
  error: { color: '#FF3B30', marginBottom: 14, textAlign: 'center', fontSize: 14, background: 'rgba(255,59,48,.1)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,59,48,.3)' },
  footer: { textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #2A2A2A' },
  footerText: { color: '#555', fontSize: 12 },
};
