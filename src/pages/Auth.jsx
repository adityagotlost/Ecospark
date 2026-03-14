import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fbRegister, fbLogin } from '../firestore';
import './Auth.css';

export default function Auth({ onAuth }) {
  const [searchParams] = useSearchParams();
  const [tab, setTab]     = useState(searchParams.get('tab') === 'login' ? 'login' : 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData]   = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', school: '', grade: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fbLogin(loginData);
      onAuth();
      navigate('/dashboard');
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
    setLoading(true); setError('');
    try {
      await fbRegister(signupData);
      onAuth();
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use' ? 'Email already registered. Please login.' :
        err.code === 'auth/weak-password'         ? 'Password is too weak.' :
        err.message || 'Sign up failed. Please try again.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">🌱</div>
            <h1>EcoSpark</h1>
            <p>India's Gamified Environmental Learning Platform</p>
          </div>
          <div className="auth-perks">
            {[
              '🏆 Earn EcoPoints & climb the leaderboard',
              '🎯 Complete real-world eco challenges',
              '🏅 Unlock exclusive digital badges',
              '📊 Track your environmental impact',
              '🌍 SDG-aligned, NEP 2020 ready',
              '🔥 Real-time leaderboard powered by Firebase',
            ].map((p, i) => (
              <div key={i} className="auth-perk">{p}</div>
            ))}
          </div>
          <div className="auth-firebase-badge">
            <span>⚡ Powered by</span>
            <span className="fb-logo">Firebase</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right glass-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
              id="auth-tab-login"
            >Login</button>
            <button
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); }}
              id="auth-tab-signup"
            >Sign Up</button>
            <div className={`auth-tab-indicator ${tab === 'signup' ? 'right' : ''}`} />
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

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
              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('signup'); setError(''); }}>Sign Up Free</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signup-name">Full Name *</label>
                  <input id="signup-name" type="text" className="form-input" placeholder="Priya Sharma"
                    value={signupData.name} onChange={e => setSignupData(p => ({...p, name: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-grade">Grade / Year</label>
                  <input id="signup-grade" type="text" className="form-input" placeholder="10th / B.Tech 2nd"
                    value={signupData.grade} onChange={e => setSignupData(p => ({...p, grade: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-school">School / College</label>
                <input id="signup-school" type="text" className="form-input" placeholder="e.g. Delhi Public School"
                  value={signupData.school} onChange={e => setSignupData(p => ({...p, school: e.target.value}))} />
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
                <button type="button" onClick={() => { setTab('login'); setError(''); }}>Login</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
