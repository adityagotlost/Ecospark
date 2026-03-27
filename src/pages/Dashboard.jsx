import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { LESSONS, CHALLENGES, ALL_BADGES, QUIZZES } from '../store';
import OnboardingModal from '../components/OnboardingModal';
import EcoScan from '../components/EcoScan';
import Confetti from '../components/Confetti';
import SplitText from '../components/SplitText';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = new Date().getDay();
const ORDERED_DAYS = [...DAYS.slice(today + 1), ...DAYS.slice(0, today + 1)];

// SDG goals alignment
const SDG_GOALS = [
  { num: 4,  label: 'Quality Education',  icon: '📚', color: '#c5192d', progress: 0, key: 'completedLessons', max: LESSONS.length },
  { num: 13, label: 'Climate Action',      icon: '🌡️', color: '#3f7e44', progress: 0, key: 'completedLessons', max: LESSONS.length },
  { num: 15, label: 'Life on Land',        icon: '🌿', color: '#56c02b', progress: 0, key: 'completedChallenges', max: CHALLENGES.length },
  { num: 6,  label: 'Clean Water',         icon: '💧', color: '#26bde2', progress: 0, key: 'completedChallenges', max: CHALLENGES.length },
];

// Impact calculator - points → real world
function calcImpact(user) {
  const lessons    = user?.completedLessons?.length    || 0;
  const challenges = user?.completedChallenges?.length || 0;
  const points     = user?.ecoPoints                   || 0;
  return {
    co2Saved:      (challenges * 2.3 + points * 0.01).toFixed(1),   // kg
    waterSaved:    (challenges * 45  + lessons * 10).toFixed(0),     // litres
    treesSupported: Math.max(0, Math.floor(points / 150)),
    plasticAvoided: (challenges * 0.8).toFixed(1),                    // kg
  };
}

function StatCard({ icon, label, value, color, delay = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : 0;
    if (!target) { setDisplay(value); return; }
    let start = 0;
    const step = target / 30;
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(Math.round(start));
      if (start >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [value]);

  return (
    <motion.div 
      className="stat-card-dash glass-card" 
      style={{ '--card-color': color }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className="scd-icon">{icon}</div>
      <div className="scd-body">
        <div className="scd-value" style={{ color }}>
          {typeof value === 'number' ? display.toLocaleString() : value}
        </div>
        <div className="scd-label">{label}</div>
      </div>
      <div className="scd-glow" style={{ background: color }} />
    </motion.div>
  );
}

function ImpactCard({ icon, value, unit, label, color }) {
  return (
    <motion.div 
      className="impact-item" 
      style={{ '--ic-color': color }}
      whileHover={{ y: -5, background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="impact-icon">{icon}</div>
      <div className="impact-val" style={{ color }}>{value}</div>
      <div className="impact-unit">{unit}</div>
      <div className="impact-label">{label}</div>
    </motion.div>
  );
}

function DailyChallenge({ user, onUpdate, onConfetti }) {
  const todayIdx = (new Date().getDay() + new Date().getDate()) % CHALLENGES.length;
  const challenge = CHALLENGES[todayIdx];
  const done = user?.completedChallenges?.includes(challenge.id);
  const [clicked, setClicked] = useState(done);

  const handleComplete = () => {
    if (!user) return;
    import('../firestore').then(({ fbCompleteChallenge }) => {
      fbCompleteChallenge(user.uid, challenge.id, challenge.points).then(() => {
        setClicked(true);
        onUpdate();
        onConfetti();
      });
    });
  };

  return (
    <div className="daily-challenge glass-card">
      <div className="dc-header">
        <span className="dc-label">⚡ Daily Challenge</span>
        <span className="dc-pts">+{challenge.points} pts</span>
      </div>
      <div className="dc-icon">{challenge.icon}</div>
      <h3 className="dc-title">{challenge.title}</h3>
      <p className="dc-desc">{challenge.desc}</p>
      {clicked || done ? (
        <div className="dc-done">✅ Completed! EcoPoints earned</div>
      ) : (
        <button className="btn-primary dc-btn" id="daily-challenge-btn" onClick={handleComplete}>
          Mark as Done
        </button>
      )}
    </div>
  );
}

function SdgWidget({ user }) {
  return (
    <div className="sdg-widget glass-card">
      <div className="sdg-header">
        <span className="sdg-title">🎯 SDG Goals Progress</span>
        <span className="sdg-sub">UN Sustainable Development Goals</span>
      </div>
      <div className="sdg-list">
        {SDG_GOALS.map(sdg => {
          const count = user?.[sdg.key]?.length || 0;
          const pct = Math.min(Math.round((count / sdg.max) * 100), 100);
          return (
            <div key={sdg.num} className="sdg-item">
              <div className="sdg-info">
                <span className="sdg-icon">{sdg.icon}</span>
                <div>
                  <div className="sdg-name">SDG {sdg.num}: {sdg.label}</div>
                </div>
                <span className="sdg-pct" style={{ color: sdg.color }}>{pct}%</span>
              </div>
              <div className="sdg-bar-track">
                <div className="sdg-bar-fill" style={{ width: `${pct}%`, background: sdg.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentBadge({ badgeId }) {
  const badge = ALL_BADGES.find(b => b.id === badgeId);
  if (!badge) return null;
  return (
    <div className="recent-badge" style={{ '--badge-color': badge.color }}>
      <span className="rb-icon">{badge.icon}</span>
      <span className="rb-name">{badge.name}</span>
    </div>
  );
}

export default function Dashboard({ user, onUpdate }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Show onboarding for new users
  useEffect(() => {
    if (user && user.ecoPoints === 0 && !localStorage.getItem('ecospark_onboarded')) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingClose = () => {
    localStorage.setItem('ecospark_onboarded', '1');
    setShowOnboarding(false);
  };

  const refreshUser = () => {
    onUpdate?.();
  };

  const impact = calcImpact(user);
  const completedCount = (user?.completedLessons?.length || 0) + (user?.completedChallenges?.length || 0) + (user?.completedQuizzes?.length || 0);
  const totalItems = LESSONS.length + CHALLENGES.length + QUIZZES.length;
  const displayCompletedCount = Math.min(completedCount, totalItems);
  const progressPct = Math.min(100, Math.round((completedCount / totalItems) * 100));

  let weeklyData = user?.weeklyPoints || [0, 0, 0, 0, 0, 0, 0];
  if (!Array.isArray(weeklyData)) {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    Object.keys(weeklyData).forEach(k => arr[parseInt(k)] = weeklyData[k]);
    weeklyData = arr;
  }
  const rotatedData = [...weeklyData.slice(today + 1), ...weeklyData.slice(0, today + 1)];

  const chartData = {
    labels: ORDERED_DAYS,
    datasets: [{
      label: 'EcoPoints',
      data: rotatedData,
      borderColor: '#34d364',
      backgroundColor: 'rgba(52, 211, 100, 0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: '#34d364',
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: 'rgba(10,30,18,0.95)',
      borderColor: 'rgba(52,211,100,0.3)',
      borderWidth: 1,
      titleColor: '#e8f5ee',
      bodyColor: '#34d364',
      padding: 10,
    }},
    scales: {
      x: { grid: { color: 'rgba(52,211,100,0.05)' }, ticks: { color: '#7aad8c' } },
      y: { grid: { color: 'rgba(52,211,100,0.05)' }, ticks: { color: '#7aad8c' } },
    },
  };

  const uniqueBadges = [...new Set(user?.badges || [])].filter(id => ALL_BADGES.some(b => b.id === id));
  const recentBadges = uniqueBadges.slice(-3);

  return (
    <motion.div 
      className="dashboard page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      {showScan && <EcoScan user={user} onClose={() => setShowScan(false)} onUpdate={refreshUser} />}
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <div className="section">
        {/* Welcome */}
        <motion.div 
          className="welcome-banner"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="welcome-text">
            <div className="welcome-greeting" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
              <SplitText text="Welcome back," delay={40} />
              <span className="gradient-text">
                <SplitText text={user?.name?.split(' ')[0] || 'Eco Hero'} delay={40} animationOffset={0.52} />
              </span>
              <motion.span 
                initial={{ opacity: 0, scale: 0 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
              >
                🌿
              </motion.span>
            </div>
            <div className="welcome-sub">
              🔥 {user?.streak || 1}-day streak · {user?.school || 'Your School'}
            </div>
          </div>
          <div className="welcome-right">
            <button className="btn-primary scan-cta-btn" onClick={() => setShowScan(true)} id="dash-scan-btn">
              📸 Scan Eco-Station
            </button>
            <Link to="/calculator" className="btn-outline calc-cta-btn" id="dash-calc-btn">
              🌍 Carbon Calculator
            </Link>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="dash-stats">
          <StatCard icon="⚡" label="Total EcoPoints"         value={user?.ecoPoints || 0}                  color="#34d364" delay={0}   />
          <StatCard icon="📚" label="Lessons Done"            value={user?.completedLessons?.length || 0}   color="#00e5c4" delay={100} />
          <StatCard icon="🎯" label="Challenges Done"         value={user?.completedChallenges?.length || 0}color="#a78bfa" delay={150} />
          <StatCard icon="🏅" label="Badges Earned"           value={uniqueBadges.length}                   color="#ffd700" delay={200} />
          <StatCard icon="🔥" label="Day Streak"              value={user?.streak || 1}                     color="#ef4444" delay={250} />
          <StatCard icon="🧠" label="Quizzes Completed"       value={user?.completedQuizzes?.length || 0}   color="#fb923c" delay={300} />
        </div>

        {/* Progress bar */}
        <motion.div 
          className="overall-progress glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="op-header">
            <span>🌱 Overall Journey Progress</span>
            <span className="op-pct gradient-text">{progressPct}%</span>
          </div>
          <div className="progress-track">
            <motion.div 
              className="progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
          </div>
          <div className="op-sub">{displayCompletedCount} of {totalItems} activities completed</div>
        </motion.div>

        {/* 🌍 REAL-WORLD IMPACT — NEW! */}
        <motion.div 
          className="impact-section glass-card"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="impact-header">
            <div>
              <div className="impact-title">🌍 Your Real-World Impact</div>
              <div className="impact-sub">Every action you take here makes a tangible difference</div>
            </div>
            <Link to="/calculator" className="impact-calc-link">Calculate precise footprint →</Link>
          </div>
          <div className="impact-grid">
            <ImpactCard icon="🌿" value={impact.co2Saved}      unit="kg"     label="CO₂ Saved"        color="#34d364" />
            <ImpactCard icon="💧" value={impact.waterSaved}    unit="litres" label="Water Conserved"  color="#3b82f6" />
            <ImpactCard icon="🌳" value={impact.treesSupported} unit="trees"  label="Trees Supported"  color="#22c55e" />
            <ImpactCard icon="♻️" value={impact.plasticAvoided} unit="kg"     label="Plastic Avoided"  color="#00e5c4" />
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="dash-grid">
          {/* Chart */}
          <div className="dash-chart glass-card">
            <div className="chart-header">
              <span className="chart-title">📈 This Week's EcoPoints</span>
              <span className="chart-total gradient-text">+{weeklyData.reduce((a,b)=>a+b,0)} pts this week</span>
            </div>
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Daily challenge */}
          <DailyChallenge user={user} onUpdate={refreshUser} onConfetti={() => setConfetti(true)} />
        </div>

        {/* SDG + Quick actions */}
        <div className="dash-bottom-grid">
          <SdgWidget user={user} />

          {/* Quick actions */}
          <div className="quick-actions-stack">
            <h2 className="section-heading">⚡ Quick Actions</h2>
            <div className="qa-grid">
              {[
                { icon: '📚', label: 'Continue Learning', sub: `${LESSONS.length - (user?.completedLessons?.length||0)} lessons left`,   path: '/learn',       color: '#00e5c4' },
                { icon: '🧠', label: 'Take a Quiz',        sub: 'Test your knowledge',                                                    path: '/quizzes',     color: '#a78bfa' },
                { icon: '🎯', label: 'Eco Challenges',     sub: `${CHALLENGES.length - (user?.completedChallenges?.length||0)} pending`,  path: '/challenges',  color: '#ffd700' },
                { icon: '🏆', label: 'Leaderboard',        sub: 'See your rank',                                                          path: '/leaderboard', color: '#34d364' },
              ].map((a, i) => (
                <Link to={a.path} key={i} className="qa-card glass-card" style={{ '--qa-color': a.color }}>
                  <div className="qa-icon" style={{ color: a.color }}>{a.icon}</div>
                  <div className="qa-label">{a.label}</div>
                  <div className="qa-sub">{a.sub}</div>
                  <div className="qa-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent badges */}
        {recentBadges.length > 0 && (
          <div className="recent-badges-section glass-card">
            <div className="rb-header">
              <span>🏅 Recently Earned Badges</span>
              <Link to="/badges" className="rb-view">View All →</Link>
            </div>
            <div className="rb-list">
              {recentBadges.map(id => <RecentBadge key={id} badgeId={id} />)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
