import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/dashboard',   label: 'Dashboard',   icon: '🏠' },
  { path: '/learn',       label: 'Learn',        icon: '📚' },
  { path: '/quizzes',     label: 'Quizzes',      icon: '🧠' },
  { path: '/challenges',  label: 'Challenges',   icon: '🎯' },
  { path: '/garden',      label: 'Garden',       icon: '🌳' },
  { path: '/leaderboard', label: 'Leaderboard',  icon: '🏆' },
  { path: '/badges',      label: 'Badges',       icon: '🏅' },
  { path: '/calculator',  label: 'Calculator',   icon: '🌍' },
];

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="EcoSpark Logo" className="logo-img" />
          <span className="logo-text">Eco<span className="logo-spark">Spark</span></span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="navbar-links">
            {NAV_LINKS.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              <div className="nav-points" title="Lifetime EcoPoints (Rank/Level)">
                <span className="points-icon">⚡</span>
                <span className="points-val">{user.ecoPoints?.toLocaleString() || 0}</span>
              </div>
              <Link to="/profile" className="nav-avatar" title="Profile">
                {user.photoURL ? <img src={user.photoURL} alt="avatar" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : user.avatar}
              </Link>
              <button className="btn-logout" onClick={handleLogout} id="navbar-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary" id="navbar-login-btn">
              Get Started
            </Link>
          )}

          {/* Hamburger */}
          {user && (
            <button
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              id="navbar-hamburger"
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`mobile-link ${location.pathname === l.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          <button className="mobile-logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      )}
    </nav>
  );
}
