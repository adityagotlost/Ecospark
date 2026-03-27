import { ALL_BADGES } from '../store';
import './Badges.css';

export default function Badges({ user }) {
  const earned = user?.badges || [];
  const earnedCount = ALL_BADGES.filter(b => earned.includes(b.id)).length;
  const totalCount  = ALL_BADGES.length;
  const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <div className="badges-page page">
      <div className="section">
        <div className="page-header">
          <h1 className="page-title">🏅 Achievement Badges</h1>
          <p className="page-sub">Unlock badges by completing eco-activities and reaching milestones</p>
        </div>

        {/* Progress overview */}
        <div className="badges-overview glass-card">
          <div className="bo-main">
            <div className="bo-circle">
              <svg viewBox="0 0 100 100" className="bo-svg">
                <circle cx="50" cy="50" r="42" className="bo-track" />
                <circle
                  cx="50" cy="50" r="42"
                  className="bo-fill"
                  style={{ strokeDashoffset: `${264 - (264 * pct) / 100}` }}
                />
              </svg>
              <div className="bo-center">
                <div className="bo-pct gradient-text">{pct}%</div>
                <div className="bo-pct-label">Unlocked</div>
              </div>
            </div>
            <div className="bo-stats">
              <div className="bo-stat">
                <div className="bo-stat-val gradient-text">{earnedCount}</div>
                <div className="bo-stat-label">Earned</div>
              </div>
              <div className="bo-stat">
                <div className="bo-stat-val" style={{color:'var(--color-text-muted)'}}>{totalCount - earnedCount}</div>
                <div className="bo-stat-label">Remaining</div>
              </div>
              <div className="bo-stat">
                <div className="bo-stat-val" style={{color:'var(--color-gold)'}}>{totalCount}</div>
                <div className="bo-stat-label">Total</div>
              </div>
            </div>
          </div>
          <div className="bo-message">
            {earnedCount === 0
              ? '🌱 Start your journey to earn your first badge!'
              : earnedCount === totalCount
              ? '🌟 Incredible! You\'ve unlocked ALL badges! True Eco Champion!'
              : `🔥 Amazing! Keep going to unlock ${totalCount - earnedCount} more badges!`
            }
          </div>
        </div>

        {/* Badge grid */}
        <div className="badges-grid">
          {ALL_BADGES.map((badge, i) => {
            const isEarned = earned.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`badge-card glass-card ${isEarned ? 'badge-earned' : 'badge-locked'}`}
                style={{ '--badge-color': badge.color, animationDelay: `${i * 50}ms` }}
                id={`badge-${badge.id}`}
              >
                {isEarned && <div className="badge-sparkle">✨</div>}
                <div className="badge-icon-wrap" style={isEarned ? { background: `${badge.color}20`, boxShadow: `0 0 20px ${badge.color}40` } : {}}>
                  <span className="badge-icon" style={isEarned ? {} : { filter: 'grayscale(1) opacity(0.3)' }}>
                    {badge.icon}
                  </span>
                </div>
                <div className="badge-name" style={isEarned ? { color: badge.color } : {}}>
                  {badge.name}
                </div>
                <div className="badge-desc">{badge.desc}</div>
                {isEarned ? (
                  <div className="badge-status-earned">✅ Unlocked</div>
                ) : (
                  <div className="badge-status-locked">🔒 Locked</div>
                )}
                {isEarned && (
                  <div className="badge-glow-ring" style={{ borderColor: badge.color }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
