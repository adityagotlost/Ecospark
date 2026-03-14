import { motion, AnimatePresence } from 'framer-motion';
import './BadgeUnlockModal.css';

export default function BadgeUnlockModal({ badge, onClose }) {
  if (!badge) return null;

  return (
    <motion.div 
      className="badge-unlock-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="badge-unlock-modal glass-card"
        initial={{ scale: 0.5, y: 100, rotate: -5 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
      >
        <div className="bu-glow" style={{ background: badge.color }} />
        
        <motion.div 
          className="bu-sparkles"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ✨✨✨
        </motion.div>

        <motion.div 
          className="bu-icon-wrap" 
          style={{ background: `${badge.color}20`, border: `2px solid ${badge.color}` }}
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <span className="bu-icon">{badge.icon}</span>
        </motion.div>

        <div className="bu-content">
          <motion.h3 
            className="bu-label"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            New Badge Unlocked!
          </motion.h3>
          <motion.h2 
            className="bu-name" 
            style={{ color: badge.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {badge.name}
          </motion.h2>
          <motion.p 
            className="bu-desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {badge.desc}
          </motion.p>
        </div>

        <motion.button 
          className="btn-primary bu-btn" 
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Awesome! 🌿
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
