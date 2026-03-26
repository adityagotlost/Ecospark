import { motion } from 'framer-motion';
import './Garden.css';

const TREE_PHASES = [
  { minLevel: 0,  emoji: "🌱", name: "Fragile Seedling", glow: "rgba(52, 211, 100, 0.3)", desc: "A tiny spark of life. Keep completing real-world tasks to help it grow!" },
  { minLevel: 3,  emoji: "🌿", name: "Growing Sapling", glow: "rgba(52, 211, 100, 0.5)", desc: "Your tree is taking root and growing stronger every day." },
  { minLevel: 6,  emoji: "🌳", name: "Lush Tree", glow: "rgba(16, 185, 129, 0.7)", desc: "A beautiful, sturdy tree. Your environmental impact is really showing!" },
  { minLevel: 10, emoji: "🌲", name: "Forest Guardian", glow: "rgba(6, 182, 212, 0.8)", desc: "An ancient, majestic guardian of the forest. Truly breathtaking!" },
  { minLevel: 15, emoji: "🌟", name: "Tree of Life", glow: "rgba(250, 204, 21, 1)", desc: "The ultimate peak of nature's harmony. You are exactly what Earth needs!" }
];

export default function Garden({ user }) {
  const points = user?.ecoPoints || 0;
  const level = Math.floor(points / 150); // 1 level per 150 pts

  // Find current phase
  const reversedPhases = [...TREE_PHASES].reverse();
  const phase = reversedPhases.find(p => level >= p.minLevel) || TREE_PHASES[0];
  const phaseIndex = TREE_PHASES.indexOf(phase);
  
  // Find next phase
  const nextPhase = TREE_PHASES[phaseIndex + 1];
  
  // Calculate progress to next phase
  let progressPct = 100;
  let nextGoal = null;
  
  if (nextPhase) {
    const currentPhaseStartPts = phase.minLevel * 150;
    const nextPhaseStartPts = nextPhase.minLevel * 150;
    const pointsInCurrentPhase = points - currentPhaseStartPts;
    const pointsNeededForPhase = nextPhaseStartPts - currentPhaseStartPts;
    progressPct = Math.min(100, Math.max(0, (pointsInCurrentPhase / pointsNeededForPhase) * 100));
    nextGoal = nextPhaseStartPts;
  }

  // Generate random fireflies
  const fireflies = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4
  }));

  return (
    <motion.div 
      className="garden-page page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background ambient fireflies */}
      <div className="fireflies-layer">
        {fireflies.map(f => (
          <motion.div
            key={f.id}
            className="firefly"
            style={{ top: f.top, left: f.left }}
            animate={{
              y: [0, -30, 0, 20, 0],
              x: [0, 20, 0, -20, 0],
              opacity: [0, 0.8, 0, 1, 0]
            }}
            transition={{
              duration: f.duration,
              repeat: Infinity,
              delay: f.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="section tree-of-life-section">
        
        <div className="tol-header">
          <h1 className="tol-title">The <span className="gradient-text">Tree of Life</span></h1>
          <p className="tol-subtitle">Your real-world eco-actions breathe life into this digital sanctuary.</p>
        </div>

        <div className="tol-centerpiece">
          <motion.div 
            className="tol-pedestal glass-card"
            style={{ '--phase-glow': phase.glow }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <div className="tol-aura" style={{ background: phase.glow }} />
            
            <motion.div 
              className="tol-emoji-wrapper"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="tol-emoji">{phase.emoji}</span>
            </motion.div>
            
            
            <div className="tol-dirt-mound" />

          </motion.div>
        </div>

        <div className="tol-info glass-card">
          <h2 className="tol-name" style={{ textShadow: `0 0 10px ${phase.glow}` }}>{phase.name}</h2>
          <p className="tol-desc">{phase.desc}</p>
          
          <div className="tol-stats">
            <div className="tol-stat-box">
              <span className="ts-label">Total Points</span>
              <span className="ts-val gradient-text">{points}</span>
            </div>
            <div className="tol-stat-box">
              <span className="ts-label">Tree Level</span>
              <span className="ts-val text-white">Lvl {level}</span>
            </div>
          </div>

          {nextPhase && (
            <div className="tol-progress-container">
              <div className="tol-progress-labels">
                <span>Next Evolution: {nextPhase.name}</span>
                <span>{points} / {nextGoal} pts</span>
              </div>
              <div className="tol-progress-bar">
                <div 
                  className="tol-progress-fill" 
                  style={{ width: `${progressPct}%`, background: nextPhase.glow, boxShadow: `0 0 10px ${nextPhase.glow}` }} 
                />
              </div>
            </div>
          )}
          {!nextPhase && (
            <div className="tol-maxed">
              🎉 Maximum Evolution Reached! You are an absolute legend.
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
