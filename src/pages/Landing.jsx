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

          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box1">
              <span className="social-icon">
                <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z" />
                </svg>
              </span>
            </div>
          </a>

          <a href="https://x.com" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box2">
              <span className="social-icon">
                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
                </svg>
              </span>
            </div>
          </a>

          <a href="https://discord.gg" target="_blank" rel="noopener noreferrer">
            <div className="social-box social-box3">
              <span className="social-icon">
                <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                  <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
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
