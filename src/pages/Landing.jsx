import { Link } from 'react-router-dom';
import './Landing.css';

const LEAVES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: ['🍃','🌿','🍀','🌱'][i % 4],
  size: 0.6 + Math.random() * 1.2,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
}));

const STATS = [
  { value: '70%+', label: 'Higher Retention with Gamified Learning', icon: '📈' },
  { value: '1M+',  label: 'Students Reached Across India',           icon: '👩‍🎓' },
  { value: '50+',  label: 'Eco Challenges Available',                 icon: '🎯' },
  { value: '10+',  label: 'Interactive Lesson Modules',               icon: '📚' },
];

const FEATURES = [
  { icon: '🎮', title: 'Gamified Learning',    desc: 'Earn EcoPoints for every lesson, quiz, and challenge. Compete with students across India.' },
  { icon: '🌍', title: 'Real-World Challenges', desc: 'Plant trees, segregate waste, save water — and earn rewards for real sustainable actions.' },
  { icon: '🏆', title: 'Live Leaderboard',      desc: 'School-level and national competitions. Climb the ranks and earn exclusive digital badges.' },
  { icon: '📊', title: 'Impact Tracking',       desc: 'Visualize your environmental impact with beautiful dashboards and progress charts.' },
  { icon: '🏅', title: 'Digital Badges',        desc: '10+ achievement badges to unlock. Show them off on your profile!' },
  { icon: '🤝', title: 'Community Action',      desc: 'Join eco-clubs, collaborate on challenges, and inspire your community.' },
];

export default function Landing({ user }) {
  return (
    <div className="landing page">

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        {/* Floating leaves */}
        <div className="leaves-container" aria-hidden="true">
          {LEAVES.map(leaf => (
            <span
              key={leaf.id}
              className="leaf"
              style={{
                left: `${leaf.left}%`,
                fontSize: `${leaf.size}rem`,
                animationDelay: `${leaf.delay}s`,
                animationDuration: `${leaf.duration}s`,
              }}
            >
              {leaf.emoji}
            </span>
          ))}
        </div>
        <div className="hero-content">
          <span className="hero-badge anim-fade-in">🌱 INDIA'S #1 ECO-EDUCATION PLATFORM</span>
          <h1 className="hero-title anim-title">
            Save the Planet.<br />
            <span className="text-gradient">Earn Points. Level Up.</span>
          </h1>
          <p className="hero-desc anim-fade-up">
            EcoSpark turns environmental education into an exciting game. 
            Complete real-world eco-challenges, ace quizzes, and compete 
            with students across India — all while making a real difference.
          </p>
          <div className="hero-actions anim-fade-up">
            {user ? (
              <Link to="/dashboard" className="btn-primary" id="hero-go-dashboard-btn">
                🚀 Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn-primary" id="hero-start-btn">
                  🌱 Start Your Journey
                </Link>
                <Link to="/auth?tab=login" className="btn-outline" id="hero-login-btn">
                  Login
                </Link>
              </>
            )}
          </div>
          <div className="hero-scroll-hint">
            <span>Scroll to explore</span>
            <div className="scroll-arrow">↓</div>
          </div>
        </div>

        {/* Floating cards */}
        <div className="hero-cards">
          <div className="float-card fc-1 anim-float">
            <span>🏆</span>
            <div>
              <div className="fc-val">2,340</div>
              <div className="fc-label">EcoPoints</div>
            </div>
          </div>
          <div className="float-card fc-2" style={{animationDelay:'1s', animation: 'float 4s 1s ease-in-out infinite'}}>
            <span>🔥</span>
            <div>
              <div className="fc-val">7 Days</div>
              <div className="fc-label">Streak</div>
            </div>
          </div>
          <div className="float-card fc-3" style={{animationDelay:'2s', animation: 'float 4s 2s ease-in-out infinite'}}>
            <span>🌱</span>
            <div>
              <div className="fc-val">Rank #3</div>
              <div className="fc-label">National</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value gradient-text">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="features-section section">
        <div className="section-header">
          <div className="section-badge">✨ Features</div>
          <h2 className="section-title">Why Students Love <span className="gradient-text">EcoSpark</span></h2>
          <p className="section-sub">Designed with NEP 2020 principles — experiential, interactive, and impactful</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner glass-card">
          <div className="cta-glow" />
          <h2>Ready to <span className="gradient-text">Spark Change?</span></h2>
          <p>Join thousands of students who are learning, competing, and making a real environmental impact.</p>
          <Link to={user ? '/dashboard' : '/auth'} className="btn-primary" id="cta-btn">
            {user ? '🚀 Go to Dashboard' : '🌱 Join EcoSpark Free'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">🌱 EcoSpark</div>
        <p>Built for Smart India Hackathon 2025 · Aligned with NEP 2020 & SDG Goals</p>
        <div className="sdg-chips">
          <span className="chip" style={{background:'rgba(52,211,100,0.15)',color:'var(--color-primary)'}}>SDG 4: Quality Education</span>
          <span className="chip" style={{background:'rgba(0,229,196,0.15)',color:'var(--color-secondary)'}}>SDG 13: Climate Action</span>
          <span className="chip" style={{background:'rgba(168,255,120,0.15)',color:'var(--color-accent)'}}>SDG 15: Life on Land</span>
        </div>
      </footer>
    </div>
  );
}
