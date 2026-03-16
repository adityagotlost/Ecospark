import { useState } from 'react';
import { CHALLENGES } from '../store';
import { fbCompleteChallenge } from '../firestore';
import Confetti from '../components/Confetti';
import PlantVerificationModal from '../components/PlantVerificationModal';
import './Challenges.css';

const DIFF_COLORS = { Easy: '#34d364', Medium: '#f59e0b', Hard: '#ef4444' };
const CAT_ICONS   = { Nature: '🌳', Waste: '♻️', Energy: '⚡', Water: '💧' };

export default function Challenges({ user, onUpdate }) {
  const [filter, setFilter] = useState('All');
  const [completing, setCompleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [verifyingChallenge, setVerifyingChallenge] = useState(null);

  const categories = ['All', 'Nature', 'Waste', 'Energy', 'Water'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleComplete = async (challenge) => {
    if (user?.completedChallenges?.includes(challenge.id)) return;
    
    if (challenge.id === 'plant-tree') {
      setVerifyingChallenge(challenge);
      return;
    }

    setCompleting(challenge.id);
    
    // Small delay for UI animation feedback
    await new Promise(res => setTimeout(res, 800));
    
    await fbCompleteChallenge(user.uid, challenge.id, challenge.points);
    onUpdate?.();
    setCompleting(null);
    setConfetti(true);
    showToast(`✅ +${challenge.points} EcoPoints earned! 🌱`);
  };

  const handleVerificationSuccess = async () => {
    const challenge = verifyingChallenge;
    if (!challenge) return;
    
    setVerifyingChallenge(null);
    setCompleting(challenge.id);
    await fbCompleteChallenge(user.uid, challenge.id, challenge.points);
    onUpdate?.();
    setCompleting(null);
    setConfetti(true);
    showToast(`✅ +${challenge.points} EcoPoints earned! 🌱`);
  };

  const filtered = filter === 'All' ? CHALLENGES : CHALLENGES.filter(c => c.category === filter);
  const doneCount = CHALLENGES.filter(c => user?.completedChallenges?.includes(c.id)).length;

  return (
    <div className="challenges-page page">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      
      <PlantVerificationModal 
        isOpen={!!verifyingChallenge}
        onClose={() => setVerifyingChallenge(null)}
        onVerify={handleVerificationSuccess}
      />

      <div className="section">
        <div className="page-header">
          <h1 className="page-title">🎯 Eco Challenges</h1>
          <p className="page-sub">Complete real-world tasks, earn EcoPoints, and make a difference</p>
        </div>

        <div className="ch-summary glass-card">
          <div className="ch-sum-item">
            <div className="ch-sum-val gradient-text">{doneCount}</div>
            <div className="ch-sum-label">Completed</div>
          </div>
          <div className="ch-divider" />
          <div className="ch-sum-item">
            <div className="ch-sum-val" style={{color:'var(--color-warn)'}}>{CHALLENGES.length - doneCount}</div>
            <div className="ch-sum-label">Remaining</div>
          </div>
          <div className="ch-divider" />
          <div className="ch-sum-item">
            <div className="ch-sum-val" style={{color:'var(--color-secondary)'}}>
              {CHALLENGES.filter(c => user?.completedChallenges?.includes(c.id)).reduce((a,c) => a + c.points, 0)}
            </div>
            <div className="ch-sum-label">Points Earned</div>
          </div>
          <div className="ch-progress-wrap">
            <div className="ch-progress-track">
              <div className="ch-progress-fill" style={{ width: `${(doneCount / CHALLENGES.length) * 100}%` }} />
            </div>
            <span className="ch-pct">{Math.round((doneCount/CHALLENGES.length)*100)}% Complete</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {categories.map(c => (
            <button
              key={c}
              className={`filter-tab ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {CAT_ICONS[c] || '🌍'} {c}
            </button>
          ))}
        </div>

        <div className="challenges-grid">
          {filtered.map((ch, i) => {
            const done = user?.completedChallenges?.includes(ch.id);
            const loading = completing === ch.id;
            return (
              <div
                key={ch.id}
                className={`challenge-card glass-card ${done ? 'ch-done' : ''}`}
                style={{ '--diff-color': DIFF_COLORS[ch.difficulty], animationDelay: `${i*60}ms` }}
              >
                <div className="ch-top">
                  <div className="ch-icon-wrap">
                    <span className="ch-icon">{ch.icon}</span>
                  </div>
                  <div className="ch-badges">
                    <span className="ch-diff-chip" style={{ color: DIFF_COLORS[ch.difficulty], background: `${DIFF_COLORS[ch.difficulty]}18` }}>
                      {ch.difficulty}
                    </span>
                    <span className="ch-cat-chip">
                      {CAT_ICONS[ch.category]} {ch.category}
                    </span>
                  </div>
                </div>
                <h3 className="ch-title">{ch.title}</h3>
                <p className="ch-desc">{ch.desc}</p>
                <div className="ch-bottom">
                  <div className="ch-pts">⚡ +{ch.points} EcoPoints</div>
                  {done ? (
                    <div className="ch-done-badge">✅ Done!</div>
                  ) : (
                    <button
                      className="btn-primary ch-btn"
                      onClick={() => handleComplete(ch)}
                      disabled={loading}
                      id={`challenge-complete-${ch.id}`}
                    >
                      {loading ? <span className="loader" /> : 'Mark Done'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
