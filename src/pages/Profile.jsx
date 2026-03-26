import { useState } from 'react';
import { ALL_BADGES, LESSONS, CHALLENGES } from '../store';
import { Link } from 'react-router-dom';
import { fbUpdateProfile } from '../firestore';
import './Profile.css';

export default function Profile({ user: propUser, onUpdate }) {
  const user = propUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editFile, setEditFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 250;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
              if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image element."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let photoDataUrl = null;
      if (editFile) {
        photoDataUrl = await processImage(editFile);
      }
      
      // Fire and forget the update to leverage Firestore's optimistic local cache
      fbUpdateProfile(user.uid, editName, photoDataUrl).catch(err => {
        console.error("Background update failed:", err);
      });
      
      if(onUpdate) onUpdate();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Failed to read image: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const earned = (user?.badges || []).map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean);

  const totalActivities = (user?.completedLessons?.length||0) + (user?.completedChallenges?.length||0) + (user?.completedQuizzes?.length||0);
  const joinDate = user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : 'Today';

  const levels = [
    { name: '🌱 Eco Seedling',   min: 0,    max: 250,  color: '#34d364' },
    { name: '🌿 Green Guardian', min: 250,  max: 500,  color: '#4ade80' },
    { name: '⚔️ Eco Warrior',     min: 500,  max: 1000, color: '#00e5c4' },
    { name: '🧠 Nature Knight',  min: 1000, max: 2000, color: '#a78bfa' },
    { name: '🌍 Planet Saver',   min: 2000, max: 5000, color: '#f97316' },
    { name: '👑 Eco Legend',     min: 5000, max: Infinity, color: '#fbbf24' },
  ];

  const currentLevel = levels.find((l, i) => user?.ecoPoints >= l.min && (user?.ecoPoints < l.max || i === levels.length - 1)) || levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel ? Math.min(100, Math.round(((user?.ecoPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)) : 100;

  return (
    <div className="profile-page page">
      <div className="section">

        {/* Header card */}
        <div className="profile-hero glass-card">
          <div className="profile-bg-glow" />
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="avatar" className="avatar-img" /> : user?.avatar}
            </div>
            <div className="profile-level-ring" />
          </div>
          <div className="profile-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <h1 className="profile-name" style={{ marginBottom: 0 }}>{user?.name}</h1>
              <button 
                className="btn-outline" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px' }}
                onClick={() => {
                  setEditName(user?.name || '');
                  setEditFile(null);
                  setIsEditing(true);
                }}
              >
                ✎ Edit
              </button>
            </div>
            <p className="profile-meta">🏫 {user?.school} &nbsp;·&nbsp; 📚 Grade {user?.grade}</p>
            <p className="profile-join">Member since {joinDate}</p>
            
            <div className="profile-level-box">
              <div className="profile-level-badge" style={{ background: `${currentLevel.color}20`, borderColor: currentLevel.color, color: currentLevel.color }}>
                {currentLevel.name}
              </div>
              {nextLevel && (
                <div className="profile-lvl-progress">
                  <div className="pl-labels">
                    <span>{levelProgress}% to {nextLevel.name.split(' ')[1]}</span>
                    <span>{user?.ecoPoints} / {nextLevel.min}</span>
                  </div>
                  <div className="pl-bar-track">
                    <div className="pl-bar-fill" style={{ width: `${levelProgress}%`, background: currentLevel.color }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="profile-stats">
          {[
            { label: 'EcoPoints',       value: user?.ecoPoints?.toLocaleString() || 0,        icon: '⚡', color: '#34d364' },
            { label: 'Day Streak',       value: user?.streak || 1,                             icon: '🔥', color: '#ef4444' },
            { label: 'Lessons Done',     value: user?.completedLessons?.length || 0,           icon: '📚', color: '#00e5c4' },
            { label: 'Challenges Done',  value: user?.completedChallenges?.length || 0,        icon: '🎯', color: '#a78bfa' },
            { label: 'Quizzes Done',     value: user?.completedQuizzes?.length || 0,           icon: '🧠', color: '#f59e0b' },
            { label: 'Badges Earned',    value: user?.badges?.length || 0,                     icon: '🏅', color: '#ffd700' },
          ].map((s, i) => (
            <div key={i} className="prof-stat glass-card" style={{ '--ps-color': s.color }}>
              <div className="ps-icon">{s.icon}</div>
              <div className="ps-val" style={{ color: s.color }}>{s.value}</div>
              <div className="ps-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Badges showcase */}
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

        {/* Recent activity */}
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
                  <span className="ai-badge" style={{background:'rgba(167,139,250,0.1)',color:'#a78bfa'}}>🎯 Challenge</span>
                </div>
              ) : null;
            })}
            {totalActivities === 0 && (
              <p className="empty-msg">No activity yet. Start learning to see your progress! 🌱</p>
            )}
          </div>
        </div>

      </div>

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
                  onChange={e => {
                    if(e.target.files[0]) setEditFile(e.target.files[0]);
                  }}
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

