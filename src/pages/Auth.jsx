import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fbRegister, fbLogin, fbResetPassword } from '../firestore';
import './Auth.css';

const SCHOOLS = [
  "Delhi Public School",
  "Kendriya Vidyalaya",
  "Navodaya Vidyalaya",
  "Army Public School",
  "Sardar Patel Vidyalaya",
  "St. Xavier's College",
  "Green Valley School",
  "Ryan International",
  "Bal Bharati Public School",
  "Modern School",
  "Haridwar University",
  "IIT Delhi",
  "IIT Bombay",
  "NIT Trichy",
  "BITS Pilani",
  "SRM University",
  "VIT Vellore"
];

export default function Auth({ onAuth }) {
  const [searchParams] = useSearchParams();
  const [tab, setTab]     = useState(searchParams.get('tab') === 'login' ? 'login' : 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData]   = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', school: '', grade: '' });
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fbLogin(loginData);
      onAuth();
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err) {
      setError(
        err.code === 'auth/user-not-found'    ? 'No account found with this email.' :
        err.code === 'auth/wrong-password'    ? 'Incorrect password.' :
        err.code === 'auth/invalid-credential'? 'Invalid email or password.' :
        err.message || 'Login failed. Please try again.'
      );
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('Please fill all required fields.'); return;
    }
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await fbRegister(signupData);
      onAuth();
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use' ? 'Email already registered. Please login.' :
        err.code === 'auth/weak-password'         ? 'Password is too weak.' :
        err.message || 'Sign up failed. Please try again.'
      );
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) { setError('Please enter your email.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await fbResetPassword(resetEmail);
      setSuccessMsg('Password reset link sent! Check your inbox.');
      setResetEmail('');
    } catch (err) {
      setError(
        err.code === 'auth/user-not-found' ? 'No account found with this email.' :
        err.message || 'Failed to send reset email.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page page">
      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <h1 className="auth-logo-text">EcoSpark</h1>
            <p>India's leading gamified environmental learning platform for students.</p>
          </div>
          <div className="auth-perks">
            {[
              '🏆 Earn EcoPoints for your school',
              '🎯 Complete real-world eco challenges',
              '🏅 Unlock exclusive digital badges',
              '📊 Track your environmental impact',
            ].map((p, i) => (
              <div key={i} className="auth-perk">{p}</div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
              id="auth-tab-login"
            >Login</button>
            <button
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
              id="auth-tab-signup"
            >Sign Up</button>
            <div className={`auth-tab-indicator ${tab === 'signup' ? 'right' : tab === 'forgot' ? 'right-far' : ''}`} />
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}
          {successMsg && <div className="auth-success" style={{color: '#10b981', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem'}}>✅ {successMsg}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email" type="email" className="form-input"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password" type="password" className="form-input"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn-primary auth-submit" disabled={loading} id="login-submit-btn">
                {loading ? <span className="loader" /> : '🌱 Login to EcoSpark'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.95rem' }}>
                <button type="button" onClick={() => { setTab('forgot'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: '500' }}>Forgot Password?</button>
              </div>
              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}>Sign Up Free</button>
              </p>
            </form>
          ) : tab === 'signup' ? (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signup-name">Full Name *</label>
                  <input id="signup-name" type="text" className="form-input" placeholder="e.g. John Doe"
                    value={signupData.name} onChange={e => setSignupData(p => ({...p, name: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-grade">Grade / Year</label>
                  <input id="signup-grade" type="text" className="form-input" placeholder="e.g. 2nd Year"
                    value={signupData.grade} onChange={e => setSignupData(p => ({...p, grade: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-school">School / College</label>
                <input id="signup-school" type="text" className="form-input" placeholder="Select or type your school"
                  list="school-list"
                  value={signupData.school} onChange={e => setSignupData(p => ({...p, school: e.target.value}))} />
                <datalist id="school-list">
                  {SCHOOLS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email *</label>
                <input id="signup-email" type="email" className="form-input" placeholder="you@example.com"
                  value={signupData.email} onChange={e => setSignupData(p => ({...p, email: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password *</label>
                <input id="signup-password" type="password" className="form-input" placeholder="Min. 6 characters"
                  value={signupData.password} onChange={e => setSignupData(p => ({...p, password: e.target.value}))} required />
              </div>
              <button type="submit" className="btn-primary auth-submit" disabled={loading} id="signup-submit-btn">
                {loading ? <span className="loader" /> : '🌱 Join EcoSpark'}
              </button>
              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}>Login</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Enter your registered email</label>
                <input
                  id="reset-email" type="email" className="form-input"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary auth-submit" disabled={loading} id="reset-submit-btn">
                {loading ? <span className="loader" /> : '📨 Send Reset Link'}
              </button>
              <p className="auth-switch">
                Remember your password?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}>Back to Login</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
