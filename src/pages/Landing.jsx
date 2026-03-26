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

      {/* Social Links Card */}
      <section className="social-section">
        <div className="social-card">
          <div className="social-background" />
          <div className="social-logo">Socials</div>

          <a href="https://instagram.com/adityagotlost" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box1">
              <span className="social-icon">
                <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z" />
                </svg>
              </span>
            </div>
          </a>

          <a href="https://github.com/adityagotlost" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box2">
              <span className="social-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </span>
            </div>
          </a>

          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=adityaanand3316@gmail.com" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box3">
              <span className="social-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </span>
            </div>
          </a>

          <div className="social-box social-box4" />
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">🌱 EcoSpark</div>
        <p>Build for Tech Sangram 2026 · Aligned with NEP 2020 & SDG Goals</p>
        <div className="sdg-chips">
          <span className="chip" style={{background:'rgba(52,211,100,0.15)',color:'var(--color-primary)'}}>SDG 4: Quality Education</span>
          <span className="chip" style={{background:'rgba(0,229,196,0.15)',color:'var(--color-secondary)'}}>SDG 13: Climate Action</span>
          <span className="chip" style={{background:'rgba(168,255,120,0.15)',color:'var(--color-accent)'}}>SDG 15: Life on Land</span>
        </div>
      </footer>
    </div>
  );
}
