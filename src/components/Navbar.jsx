import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout, theme, onToggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { 
      name: 'Learning', icon: '📚',
      subLinks: [
        { name: 'Lessons', path: '/learn', icon: '📖' },
        { name: 'Quizzes', path: '/quizzes', icon: '🎯' },
        { name: 'Insights', path: '/insights', icon: '✨' },
      ]
    },
    {
      name: 'Impact', icon: '🌍',
      subLinks: [
        { name: 'Eco Map', path: '/eco-map', icon: '🗺️' },
        { name: 'Challenges', path: '/challenges', icon: '⚔️' },
        { name: 'Calculator', path: '/calculator', icon: '🧮' },
      ]
    },
    {
      name: 'Community', icon: '👥',
      subLinks: [
        { name: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
        { name: 'Badges',      path: '/badges',      icon: '🏅' },
        { name: 'Marketplace', path: '/marketplace', icon: '🛒' },
      ]
    },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/ecospark-v2.png" alt="EcoSpark Logo" className="logo-img" />
          <span className="logo-text">Eco<span className="logo-spark">Spark</span></span>
        </Link>

        {/* Desktop Links */}
        {user && (
          <div className="navbar-links">
            {navItems.map((item) => (
              item.subLinks ? (
                <div key={item.name} className="nav-dropdown-wrapper">
                  <div className={`nav-link dropdown-toggle ${item.subLinks.some(sub => location.pathname === sub.path) ? 'active' : ''}`}>
                    <span className="nav-icon">{item.icon}</span>
                    {item.name}
                    <span className="chevron">▾</span>
                  </div>
                  <div className="nav-dropdown-menu">
                    {item.subLinks.map(sub => (
                      <Link 
                        key={sub.path} 
                        to={sub.path} 
                        className={`dropdown-link ${location.pathname === sub.path ? 'active' : ''}`}
                      >
                        <span className="nav-icon">{sub.icon}</span>
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.name}
                </Link>
              )
            ))}
          </div>
        )}

        {/* Desktop Right Side */}
        <div className="navbar-right">
          {user ? (
            <>
              <div className="nav-points">
                <span className="points-icon">⚡</span>
                <span>{(user?.ecoPoints || 0).toLocaleString()}</span>
              </div>
              <button 
                className="btn-theme" 
                onClick={onToggleTheme} 
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button 
                className={`hamburger ${menuOpen ? 'open' : ''}`} 
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <span />
                <span />
                <span />
              </button>
              <button className="btn-logout" onClick={onLogout}>Logout</button>

            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button 
                className="btn-theme" 
                onClick={onToggleTheme} 
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <Link to="/auth" className="btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && user && (
        <div className="mobile-menu glass-card anim-fade-in">
          <div className="mobile-points">
            <span className="m-pts-label">EcoPoints</span>
            <span className="m-pts-val">⚡ {(user?.ecoPoints || 0).toLocaleString()}</span>
          </div>
          
          <div className="mobile-links-grid">
            {navItems.flatMap(item => item.subLinks || [item]).map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>
          
          <button className="mobile-logout" onClick={onLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
