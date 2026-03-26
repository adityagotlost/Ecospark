import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_BADGES, LESSONS, CHALLENGES, PROFILE_THEMES, AVATAR_FRAMES, CERTIFICATE_MILESTONES } from '../store';
import { Link } from 'react-router-dom';
import { fbUpdateProfile } from '../firestore';
import CertificateModal from '../components/CertificateModal';
import './Profile.css';

export default function Profile({ user: propUser, onUpdate }) {
  const user = propUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  // Active theme & frame — read from user data or defaults
  const activeThemeId = user?.profileTheme || 'seedling';
  const activeFrameId = user?.profileFrame  || 'default';
  const activeTheme   = PROFILE_THEMES.find(t => t.id === activeThemeId) || PROFILE_THEMES[0];
  const activeFrame   = AVATAR_FRAMES.find(f => f.id === activeFrameId)  || AVATAR_FRAMES[0];

  // ── helpers ────────────────────────────────────────────────────
  const processImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 250;
            let { width, height } = img;
            if (width > height) {
              if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
              if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch (err) { reject(err); }
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let photoDataUrl = null;
      if (editFile) photoDataUrl = await processImage(editFile);
      fbUpdateProfile(user.uid, editName, photoDataUrl).catch(console.error);
      if (onUpdate) onUpdate();
      setIsEditing(false);
    } catch (e) {
      alert('Failed to read image: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const applyTheme = async (themeId) => {
    if (!user) return;
    fbUpdateProfile(user.uid, user.name, null, themeId, null).catch(console.error);
    if (onUpdate) onUpdate();
  };

  const applyFrame = async (frameId) => {
    if (!user) return;
    fbUpdateProfile(user.uid, user.name, null, null, frameId).catch(console.error);
    if (onUpdate) onUpdate();
  };

  // ── derived data ───────────────────────────────────────────────
  const earned = (user?.badges || []).map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean);
  const totalActivities = (user?.completedLessons?.length || 0) + (user?.completedChallenges?.length || 0) + (user?.completedQuizzes?.length || 0);
  const joinDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Today';

  const levels = [
    { name: '🌱 Eco Seedling',   min: 0,    max: 250,      color: '#34d364' },
    { name: '🌿 Green Guardian', min: 250,  max: 500,      color: '#4ade80' },
    { name: '⚔️ Eco Warrior',     min: 500,  max: 1000,     color: '#00e5c4' },
    { name: '🧠 Nature Knight',  min: 1000, max: 2000,     color: '#a78bfa' },
    { name: '🌍 Planet Saver',   min: 2000, max: 5000,     color: '#f97316' },
    { name: '👑 Eco Legend',     min: 5000, max: Infinity,  color: '#fbbf24' },
  ];

  const currentLevel = levels.find((l, i) =>
    user?.ecoPoints >= l.min && (user?.ecoPoints < l.max || i === levels.length - 1)
  ) || levels[0];
  const nextLevel    = levels[levels.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel ? Math.min(100, Math.round((user?.ecoPoints / nextLevel.min) * 100)) : 100;

  const isThemeUnlocked = (t) => (user?.ecoPoints || 0) >= t.unlockPoints;
  const isFrameUnlocked = (f) => f.unlockBadge === null || (user?.badges || []).includes(f.unlockBadge);

  // ── hero card dynamic styles ───────────────────────────────────
  const heroStyle = {
    '--theme-primary':    activeTheme.primary,
    '--theme-secondary':  activeTheme.secondary,
    '--theme-glow':       activeTheme.glow,
    '--theme-bg':         activeTheme.bg,
    '--theme-gradient':   activeTheme.gradient,
    '--frame-color':      activeFrame.isRainbow ? 'transparent' : activeFrame.borderColor,
    '--frame-glow':       activeFrame.glow,
  };

  return (
    <div className="profile-page page">
      <div className="section">

        {/* ── Hero Card ── */}
        <motion.div
          className="profile-hero glass-card themed-hero"
          style={heroStyle}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <div className="profile-bg-glow themed-bg-glow" />
          <div className="profile-avatar-wrap">
            <div className="profile-avatar themed-avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" className="avatar-img" />
                : user?.avatar}
            </div>
            {/* Dynamic Frame Ring */}
            <div className={`profile-level-ring themed-frame ${activeFrame.animation}${activeFrame.isRainbow ? ' rainbow-frame' : ''}`} />
          </div>

          <div className="profile-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <h1 className="profile-name" style={{ marginBottom: 0 }}>{user?.name}</h1>
              <button
                className="btn-outline"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px' }}
                onClick={() => { setEditName(user?.name || ''); setEditFile(null); setIsEditing(true); }}
              >
                ✎ Edit
              </button>
              <button
                className="btn-outline customize-btn"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', borderColor: activeTheme.primary, color: activeTheme.primary }}
                onClick={() => setShowCustomize(v => !v)}
              >
                🎨 Customize
              </button>
            </div>
            <p className="profile-meta">🏫 {user?.school} &nbsp;·&nbsp; 📚 Grade {user?.grade}</p>
            <p className="profile-join">Member since {joinDate}</p>

            <div className="profile-level-box">
              <div
                className="profile-level-badge"
                style={{ background: `${currentLevel.color}20`, borderColor: currentLevel.color, color: currentLevel.color }}
              >
                {currentLevel.name}
              </div>
              {nextLevel && (
                <div className="profile-lvl-progress">
                  <div className="pl-labels">
                    <span>{levelProgress}% to {nextLevel.name.split(' ')[1]}</span>
                    <span>{user?.ecoPoints} / {nextLevel.min}</span>
                  </div>
                  <div className="pl-bar-track">
                    <div className="pl-bar-fill" style={{ width: `${levelProgress}%`, background: activeTheme.gradient }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Customize Panel ── */}
        <AnimatePresence>
          {showCustomize && (
            <motion.div
              className="customize-panel glass-card"
              initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: 'top' }}
            >
              {/* Theme Picker */}
              <div className="cp-section">
                <div className="cp-label">🖌️ Profile Theme <span className="cp-sub">Unlock by leveling up</span></div>
                <div className="cp-row">
                  {PROFILE_THEMES.map(theme => {
                    const unlocked = isThemeUnlocked(theme);
                    const active   = activeThemeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        className={`theme-swatch ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                        style={{ '--sw-grad': theme.gradient, '--sw-glow': theme.glow }}
                        onClick={() => unlocked && applyTheme(theme.id)}
                        title={unlocked ? theme.name : `🔒 ${theme.unlockLabel}`}
                      >
                        <div className="sw-circle">
                          {!unlocked && <span className="sw-lock">🔒</span>}
                          {active && unlocked && <span className="sw-check">✓</span>}
                        </div>
                        <div className="sw-name">{theme.name}</div>
                        {!unlocked && <div className="sw-req">{theme.unlockLabel}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frame Picker */}
              <div className="cp-section">
                <div className="cp-label">🔮 Avatar Frame <span className="cp-sub">Unlock by earning badges</span></div>
                <div className="cp-row">
                  {AVATAR_FRAMES.map(frame => {
                    const unlocked = isFrameUnlocked(frame);
                    const active   = activeFrameId === frame.id;
                    return (
                      <div
                        key={frame.id}
                        className={`frame-option ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                        onClick={() => unlocked && applyFrame(frame.id)}
                        title={unlocked ? frame.name : `🔒 ${frame.unlockLabel}`}
                      >
                        <div className="fo-preview">
                          <div
                            className={`fo-ring ${frame.animation}${frame.isRainbow ? ' rainbow-frame' : ''}`}
                            style={frame.isRainbow ? {} : { '--frame-color': frame.borderColor, '--frame-glow': frame.glow }}
                          />
                          <div className="fo-dot" style={{ background: frame.isRainbow ? 'linear-gradient(135deg,#fbbf24,#f43f5e,#a78bfa)' : frame.borderColor }} />
                          {!unlocked && <span className="fo-lock">🔒</span>}
                          {active && unlocked && <span className="fo-check">✓</span>}
                        </div>
                        <div className="fo-name">{frame.name}</div>
                        {!unlocked && <div className="fo-req">{frame.unlockLabel}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Row ── */}
        <div className="profile-stats">
          {[
            { label: 'EcoPoints',       value: user?.ecoPoints?.toLocaleString() || 0,       icon: '⚡', color: '#34d364' },
            { label: 'Day Streak',       value: user?.streak || 1,                            icon: '🔥', color: '#ef4444' },
            { label: 'Lessons Done',     value: user?.completedLessons?.length || 0,          icon: '📚', color: '#00e5c4' },
            { label: 'Challenges Done',  value: user?.completedChallenges?.length || 0,       icon: '🎯', color: '#a78bfa' },
            { label: 'Quizzes Done',     value: user?.completedQuizzes?.length || 0,          icon: '🧠', color: '#f59e0b' },
            { label: 'Badges Earned',    value: user?.badges?.length || 0,                    icon: '🏅', color: '#ffd700' },
          ].map((s, i) => (
            <div key={i} className="prof-stat glass-card" style={{ '--ps-color': s.color }}>
              <div className="ps-icon">{s.icon}</div>
              <div className="ps-val" style={{ color: s.color }}>{s.value}</div>
              <div className="ps-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        <div className="profile-section">
          <div className="ps-header">
            <h2 className="ps-title">🏅 My Badges</h2>
            <Link to="/badges" className="ps-view">View All →</Link>
          </div>
          <div className="prof-badges-grid">
            {earned.length === 0 ? (
              <p className="empty-msg">No badges yet! Complete lessons and challenges to earn them. 🌱</p>
            ) : (
              earned.map(badge => (
                <div key={badge.id} className="prof-badge-card glass-card" style={{ '--badge-color': badge.color }}>
                  <div className="pbc-icon-wrap" style={{ background: `${badge.color}18`, boxShadow: `0 0 15px ${badge.color}30` }}>
                    {badge.icon}
                  </div>
                  <div className="pbc-name" style={{ color: badge.color }}>{badge.name}</div>
                  <div className="pbc-desc">{badge.desc}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Certificates ── */}
        <div className="profile-section">
          <div className="ps-header">
            <h2 className="ps-title">🏆 My Certificates</h2>
            <span className="ps-view" style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
              {CERTIFICATE_MILESTONES.filter(c => c.condition(user)).length} / {CERTIFICATE_MILESTONES.length} earned
            </span>
          </div>
          <div className="cert-milestone-grid">
            {CERTIFICATE_MILESTONES.map(cert => {
              const earned = cert.condition(user);
              return (
                <motion.div
                  key={cert.id}
                  className={`cert-milestone-card glass-card ${earned ? 'earned' : 'locked'}`}
                  style={{ '--cm-color': cert.color }}
                  whileHover={earned ? { y: -5, scale: 1.02 } : { scale: 1.01 }}
                  onClick={() => earned && setSelectedCert(cert)}
                  title={earned ? `View & download your certificate` : `Not yet earned`}
                >
                  <div className="cmc-icon-wrap" style={earned ? { background: `${cert.color}18`, boxShadow: `0 0 18px ${cert.color}30` } : {}}>
                    <span className="cmc-icon">{cert.icon}</span>
                    {!earned && <span className="cmc-lock">🔒</span>}
                  </div>
                  <div className="cmc-body">
                    <div className="cmc-title" style={earned ? { color: cert.color } : {}}>{cert.title}</div>
                    <div className="cmc-sub">{cert.subtitle}</div>
                    <div className="cmc-desc">{cert.description}</div>
                  </div>
                  <div className="cmc-footer">
                    <span className="cmc-level" style={earned ? { background: `${cert.color}18`, color: cert.color, border: `1px solid ${cert.color}40` } : {}}>
                      {cert.level}
                    </span>
                    {earned && <span className="cmc-dl">📥 Download →</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="profile-section">
          <h2 className="ps-title">⚡ Recent Activity</h2>
          <div className="activity-list glass-card">
            {(user?.completedLessons || []).slice(-3).map(id => {
              const l = LESSONS.find(x => x.id === id);
              return l ? (
                <div key={id} className="activity-item">
                  <span className="ai-icon">{l.icon}</span>
                  <div className="ai-body">
                    <div className="ai-title">Completed: {l.title}</div>
                    <div className="ai-pts">+{l.points} EcoPoints</div>
                  </div>
                  <span className="ai-badge">📚 Lesson</span>
                </div>
              ) : null;
            })}
            {(user?.completedChallenges || []).slice(-3).map(id => {
              const c = CHALLENGES.find(x => x.id === id);
              return c ? (
                <div key={id} className="activity-item">
                  <span className="ai-icon">{c.icon}</span>
                  <div className="ai-body">
                    <div className="ai-title">Completed: {c.title}</div>
                    <div className="ai-pts">+{c.points} EcoPoints</div>
                  </div>
                  <span className="ai-badge" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>🎯 Challenge</span>
                </div>
              ) : null;
            })}
            {totalActivities === 0 && (
              <p className="empty-msg">No activity yet. Start learning to see your progress! 🌱</p>
            )}
          </div>
        </div>

      </div>

      {/* ── Certificate Modal ── */}
      {selectedCert && (
        <CertificateModal
          cert={selectedCert}
          user={user}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* ── Edit Modal ── */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => !isSaving && setIsEditing(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Edit Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => { if (e.target.files[0]) setEditFile(e.target.files[0]); }}
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
