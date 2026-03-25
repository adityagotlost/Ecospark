import { motion } from 'framer-motion';
import './Garden.css';

const TREE_STAGES = [
  "🌱", "🌿", "🍀", "🪴", // Level 1-4: Sprouts
  "🌲", "🌳", "🌴", "🌵", // Level 5-8: Standard Trees
  "🎋", "🌸", "🌻", "🌺", // Level 9-12: Exotic & Flowers
  "🍄", "🍁", "🍄", "🏵️", // Level 13-16: Forest Magic
  "🍎", "🍊", "🍋", "🍌", // Level 17-20: Fruit Trees
  "🍉", "🍇", "🍓", "🍍"  // Level 21-24: Rare Fruits
];

export default function Garden({ user }) {
  const points = user?.ecoPoints || 0;
  const treesEarned = Math.floor(points / 150);
  const totalPlots = 24; // 4x6 grid

  const plots = Array.from({ length: totalPlots }, (_, i) => ({
    id: i,
    hasTree: i < treesEarned,
    reqPoints: (i + 1) * 150,
    emoji: TREE_STAGES[i % TREE_STAGES.length]
  }));

  // Generate random fireflies
  const fireflies = Array.from({ length: 15 }, (_, i) => ({
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
              y: [0, -20, 0, 15, 0],
              x: [0, 15, 0, -15, 0],
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

      <div className="section">
        <div className="garden-header glass-card">
          <div className="gh-content">
            <h1 className="gh-title">Your Digital <span className="gradient-text">Garden</span> 🌲</h1>
            <p className="gh-desc">
              Every real-world action you complete plants a seed here! 
              You've earned <strong>{treesEarned}</strong> {treesEarned === 1 ? 'tree' : 'trees'} so far.
            </p>
          </div>
          <div className="gh-stats">
            <div className="gh-stat">
              <span className="gs-label">Next Tree At</span>
              <span className="gs-val text-yellow">{(treesEarned + 1) * 150} pts</span>
            </div>
            <div className="gh-divider" />
            <div className="gh-stat">
              <span className="gs-label">Current Points</span>
              <span className="gs-val text-green">{points} pts</span>
            </div>
          </div>
        </div>

        <div className="garden-grid-container glass-card">
          <div className="garden-grid">
            {plots.map(plot => (
              <div 
                key={plot.id} 
                className={`garden-plot ${plot.hasTree ? 'has-tree' : 'empty'}`}
                title={plot.hasTree ? "A beautiful tree you planted!" : `Unlocks at ${plot.reqPoints} points`}
              >
                <div className="plot-dirt">
                  {plot.hasTree ? (
                    <motion.div 
                      className="tree-wrapper"
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 100, 
                        damping: 10,
                        delay: plot.id * 0.1 
                      }}
                    >
                      <span className="plot-emoji">{plot.emoji}</span>
                      <div className={`tree-glow ${plot.id > 15 ? 'rare-glow' : ''}`} />
                    </motion.div>
                  ) : (
                    <div className="empty-plot-hint">
                      <span className="padlock">🔒</span>
                      <span>{plot.reqPoints}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
