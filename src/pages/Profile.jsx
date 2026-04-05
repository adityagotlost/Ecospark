import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_BADGES, LESSONS, CHALLENGES, QUIZZES, PROFILE_THEMES, AVATAR_FRAMES, CERTIFICATE_MILESTONES } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { fbUpdateProfile } from '../firestore';
import CertificateModal from '../components/CertificateModal';
import './Profile.css';

export default function Profile({ user: propUser, onUpdate }) {
  const user = propUser;
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const [localTheme, setLocalTheme] = useState(user?.profileTheme || 'seedling');
  const [localFrame, setLocalFrame] = useState(user?.profileFrame || 'default');

  useEffect(() => {
    if (user?.profileTheme) setLocalTheme(user.profileTheme);
    if (user?.profileFrame) setLocalFrame(user.profileFrame);
  }, [user?.profileTheme, user?.profileFrame]);

  // 1. Safe Theme/Frame check
  const activeThemeId = localTheme;
  const activeFrameId = localFrame;
  const activeTheme   = PROFILE_THEMES.find(t => t.id === activeThemeId) || PROFILE_THEMES[0];
  const activeFrame   = AVATAR_FRAMES.find(f => f.id === activeFrameId)  || AVATAR_FRAMES[0];

  // ── Safety Check 1 ───────────────────────────────────────────
  if (!user) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--color-text-muted)' }}>🌱 Loading Profile...</div>;
  }

  // ── Derived Data (Safe Zone) ──────────────────────────────────
  const badgesData = user?.badges || [];
  const earned = [...new Set(badgesData)].map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean);
  
  const lessonCount    = user?.completedLessons?.length || 0;
  const challengeCount = user?.completedChallenges?.length || 0;
  const quizCount      = user?.completedQuizzes?.length || 0;
  const totalAct       = lessonCount + challengeCount + quizCount;

  const joinDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  const levels = [
    { name: '🌱 Eco Seedling',   min: 0,    max: 250,      color: '#34d364' },
    { name: '🌿 Green Guardian', min: 250,  max: 500,      color: '#4ade80' },
    { name: '⚔️ Eco Warrior',     min: 500,  max: 1000,     color: '#00e5c4' },
    { name: '🧠 Nature Knight',  min: 1000, max: 2000,     color: '#a78bfa' },
    { name: '🌍 Planet Saver',   min: 2000, max: 5000,     color: '#f97316' },
    { name: '👑 Eco Legend',     min: 5000, max: Infinity,  color: '#fbbf24' },
  ];

  const currentLevel = levels.find((l, i) =>
    (user?.ecoPoints || 0) >= l.min && ((user?.ecoPoints || 0) < l.max || i === levels.length - 1)
  ) || levels[0];

  const isThemeUnlocked = (t) => (user?.ecoPoints || 0) >= (t?.unlockPoints || 0);
  const isFrameUnlocked = (f) => f.unlockBadge === null || (user?.badges || []).includes(f.unlockBadge);

  // ── handlers ──────────────────────────────────────────────────
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
    setIsSaving(true);
    try {
      let photoDataUrl = null;
      if (editFile) photoDataUrl = await processImage(editFile);
      await fbUpdateProfile(user.uid, editName, photoDataUrl, null, null, editBio);
      if (onUpdate) onUpdate();
      setIsEditing(false);
    } catch (e) {
      alert('Failed to save profile: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };


  const applyTheme = async (themeId) => {
    setLocalTheme(themeId);
    await fbUpdateProfile(user.uid, editName, null, themeId, null, editBio).catch(console.error);
    if (onUpdate) onUpdate();
  };

  const applyFrame = async (frameId) => {
    setLocalFrame(frameId);
    await fbUpdateProfile(user.uid, editName, null, null, frameId, editBio).catch(console.error);
    if (onUpdate) onUpdate();
  };


  const heroStyle = {
    '--theme-primary':    activeTheme.primary || '#34d364',
    '--theme-secondary':  activeTheme.secondary || '#10b981',
    '--theme-glow':       activeTheme.glow || 'rgba(52,211,100,0.3)',
    '--theme-bg':         activeTheme.bg || '#050d0a',
    '--theme-gradient':   activeTheme.gradient || 'linear-gradient(135deg, #34d364, #10b981)',
    '--frame-color':      activeFrame.isRainbow ? 'transparent' : (activeFrame.borderColor || '#34d364'),
    '--frame-glow':       activeFrame.glow || 'rgba(52,211,100,0.5)',
  };

  const nextGoals = ALL_BADGES.filter(b => !user?.badges?.includes(b.id)).slice(0, 3);

  return (
    <div className="profile-page page">
      <div className="section">

        {/* ── Hero Card ── */}
        <motion.div
          className="profile-hero glass-card themed-hero"
          style={heroStyle}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="profile-bg-glow themed-bg-glow" />
          <div className="profile-avatar-wrap">
            <div className="profile-avatar themed-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="avatar-img" />
              ) : (
                <span style={{ fontSize: '2rem' }}>{user?.name?.[0] || '🌱'}</span>
              )}
            </div>
            <div className={`profile-level-ring themed-frame ${activeFrame.animation || ''}${activeFrame.isRainbow ? ' rainbow-frame' : ''}`} />
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-bio" style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontStyle: 'italic', maxWidth: '500px' }}>
              {user?.bio || 'Eco Citizen on a mission to save the planet. 🌍'}
            </p>
            <p className="profile-meta">🏫 {user?.school} &nbsp;·&nbsp; 📚 Grade {user?.grade}</p>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-primary customize-btn" onClick={() => setShowCustomize(v => !v)}>
                {showCustomize ? '✨ Close Studio' : '🎨 Profile Studio'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Profile Studio (Extended Customize) ── */}
        <AnimatePresence>
          {showCustomize && (
            <motion.div 
              className="customize-panel glass-card anim-fade-up"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="studio-grid">
                <div className="studio-left">
                  <div className="cp-section">
                    <div className="cp-label">✏️ Identity</div>
                    <div className="form-group">
                      <label>Eco Name</label>
                      <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Eco Bio</label>
                      <textarea className="form-input" style={{ minHeight: '80px' }} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell us your eco mission..." />
                    </div>
                    <div className="form-group">
                      <label>Profile Picture</label>
                      <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                    </div>
                    <button className="btn-outline" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Processing...' : 'Update Profile'}
                    </button>
                  </div>
                </div>

                <div className="studio-right">
                  <div className="cp-section">
                    <div className="cp-label">🖌️ Profile Theme <span className="cp-sub">Colors & Glow</span></div>
                    <div className="cp-row">
                      {PROFILE_THEMES.map(theme => (
                        <div key={theme.id} className={`theme-swatch ${activeThemeId === theme.id ? 'active' : ''} ${!isThemeUnlocked(theme) ? 'locked' : ''}`} style={{ '--sw-grad': theme.gradient }} onClick={() => isThemeUnlocked(theme) && applyTheme(theme.id)}>
                          <div className="sw-circle">{!isThemeUnlocked(theme) && '🔒'}</div>
                          <div className="sw-name">{theme.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cp-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <div className="cp-label">✨ Avatar Frame <span className="cp-sub">Cosmetic Rings</span></div>
                    <div className="cp-row">
                      {AVATAR_FRAMES.map(frame => (
                        <div key={frame.id} className={`frame-option ${activeFrameId === frame.id ? 'active' : ''} ${!isFrameUnlocked(frame) ? 'locked' : ''}`} onClick={() => isFrameUnlocked(frame) && applyFrame(frame.id)}>
                          <div className="fo-preview">
                            <div className="fo-ring" style={{ borderColor: frame.borderColor, boxShadow: `0 0 10px ${frame.glow}` }} />
                            <div className="fo-dot" style={{ background: frame.isRainbow ? 'linear-gradient(90deg,#fbbf24,#f43f5e,#a78bfa,#00e5c4)' : (frame.borderColor || '#34d364') }} />
                            {!isFrameUnlocked(frame) && <span className="fo-lock">🔒</span>}
                          </div>
                          <div className="fo-name">{frame.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats ── */}
        <div className="profile-stats">
          {[
            { label: 'Current Level',   val: currentLevel.name,                            icon: '🏆', col: currentLevel.color },
            { label: 'EcoPoints',       val: (user?.ecoPoints || 0).toLocaleString(),      icon: '⚡', col: '#34d364' },
            { label: 'Day Streak',      val: user?.streak || 1,                            icon: '🔥', col: '#ef4444' },
            { label: 'Badges',          val: `${earned.length}/${ALL_BADGES.length}`,      icon: '🏅', col: '#ffd700' },
            { label: 'Lessons',         val: lessonCount,                                  icon: '📚', col: '#00e5c4' },
            { label: 'Challenges',      val: challengeCount,                               icon: '🎯', col: '#a78bfa' },
            { label: 'Quizzes',         val: quizCount,                                    icon: '🧠', col: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="prof-stat glass-card" style={{ '--ps-color': s.col }}>
              <div className="ps-icon">{s.icon}</div>
              <div className="ps-val" style={{ color: s.col, fontSize: s.label === 'Current Level' ? '0.9rem' : '1.3rem' }}>{s.val}</div>
              <div className="ps-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        <div className="profile-section">
          <div className="ps-header">
            <h2 className="ps-title">🏅 My Badges <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({earned.length}/{ALL_BADGES.length})</span></h2>
            <Link to="/badges" className="ps-view">View Roadmap →</Link>
          </div>
          <div className="prof-badges-grid">
            {earned.length === 0 ? (
              <p className="empty-msg">No badges earned yet. 🌱</p>
            ) : (
              earned.map(b => (
                <div key={b.id} className="prof-badge-card glass-card" style={{ '--badge-color': b.color }}>
                  <div className="pbc-icon-wrap" style={{ background: `${b.color}15` }}>{b.icon}</div>
                  <div className="pbc-name" style={{ color: b.color }}>{b.name}</div>
                  <div className="pbc-desc" style={{ fontSize: '0.7rem' }}>{b.desc}</div>
                </div>
              ))
            )}
            
            {/* Next Goals Preview */}
            {nextGoals.map(b => (
              <div key={b.id} className="prof-badge-card locked-preview" onClick={() => navigate('/badges')}>
                <div className="pbc-icon-wrap" style={{ background: 'rgba(255,255,255,0.03)', opacity: 0.3 }}>{b.icon}</div>
                <div className="pbc-name" style={{ opacity: 0.4 }}>{b.name}</div>
                <div className="pbc-status" style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)' }}>Next Goal 🔒</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Certificates ── */}
        <div className="profile-section">
          <div className="ps-header">
            <h2 className="ps-title">🏆 My Certificates</h2>
            <span className="ps-view" style={{ opacity: 0.6, fontSize: '0.8rem' }}>
              {CERTIFICATE_MILESTONES.filter(c => c.condition(user)).length} / {CERTIFICATE_MILESTONES.length}
            </span>
          </div>
          <div className="cert-milestone-grid">
            {CERTIFICATE_MILESTONES.map(cert => {
              const isEarned = cert.condition(user);
              return (
                <div
                  key={cert.id}
                  className={`cert-milestone-card glass-card ${isEarned ? 'earned' : 'locked'}`}
                  style={{ '--cm-color': cert.color, cursor: isEarned ? 'pointer' : 'default' }}
                  onClick={() => isEarned && setSelectedCert(cert)}
                >
                  <div className="cmc-icon-wrap" style={isEarned ? { background: `${cert.color}15` } : {}}>
                    {cert.icon}
                    {!isEarned && <span style={{ fontSize: '0.8rem' }}>🔒</span>}
                  </div>
                  <div className="cmc-body">
                    <div className="cmc-title" style={isEarned ? { color: cert.color } : {}}>{cert.title}</div>
                    <div className="cmc-sub">{cert.subtitle}</div>
                    {isEarned && <span style={{ color: cert.color, fontSize: '0.7rem' }}>Click to view & download →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Activity ── */}

        <div className="profile-section">
          <h2 className="ps-title">⚡ Recent Activity <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({totalAct} total)</span></h2>
          <div className="activity-list glass-card">
            {(() => {
              const acts = [
                ...(user?.completedLessons || []).map(id => {
                  const x = LESSONS.find(l => l.id === id);
                  return x ? { id: `l-${id}`, icon: x.icon, title: x.title, type: 'Lesson', col: '#10b981' } : null;
                }),
                ...(user?.completedChallenges || []).map(id => {
                  const x = CHALLENGES.find(c => c.id === id);
                  return x ? { id: `c-${id}`, icon: x.icon, title: x.title, type: 'Challenge', col: '#a78bfa' } : null;
                }),
                ...(user?.completedQuizzes || []).map(q => {
                  const x = QUIZZES.find(qz => qz.id === q.quizId);
                  return x ? { id: `q-${q.quizId}`, icon: x.icon, title: x.title, type: 'Quiz', col: '#f59e0b', sub: `${q.score}/${q.total}` } : null;
                })
              ].filter(Boolean).slice(-6).reverse();

              return acts.length ? acts.map(a => (
                <div key={a.id} className="activity-item">
                  <span className="ai-icon">{a.icon}</span>
                  <div className="ai-body">
                    <div className="ai-title">{a.title}</div>
                    {a.sub && <div className="ai-pts">Score: {a.sub}</div>}
                  </div>
                  <span className="ai-badge" style={{ background: `${a.col}15`, color: a.col }}>{a.type}</span>
                </div>
              )) : <p className="empty-msg">No activity yet.</p>;
            })()}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedCert && <CertificateModal cert={selectedCert} user={user} onClose={() => setSelectedCert(null)} />}
      
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>Edit Profile</h2>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" placeholder="Name" style={{ width: '100%', marginBottom: '1rem' }} />
            <input type="file" accept="image/*" onChange={e => setEditFile(e.target.files[0])} className="input-field" style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
