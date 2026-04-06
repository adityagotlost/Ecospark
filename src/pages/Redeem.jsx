import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fbRedeemQrCode } from '../firestore';
import './Redeem.css';

const PARTICLES = Array.from({ length: 20 }, (_, i) => i);

export default function Redeem({ user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  const [status, setStatus] = useState('idle'); // idle | loading | success | error | already
  const [message, setMessage] = useState('');
  const [reward, setReward] = useState(null);

  useEffect(() => {
    if (!user) return; // wait for auth
    if (!code) {
      setStatus('error');
      setMessage('No redemption code found in this QR code.');
      return;
    }
    handleRedeem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRedeem = async () => {
    setStatus('loading');
    const result = await fbRedeemQrCode(user.uid, code);
    if (result.success) {
      setReward({ points: result.points, coins: result.coins, label: result.label });
      setStatus('success');
    } else {
      setMessage(result.error);
      setStatus(result.error.includes('already') ? 'already' : 'error');
    }
  };

  return (
    <div className="redeem-page">
      {/* Background particles on success */}
      <AnimatePresence>
        {status === 'success' && PARTICLES.map(i => (
          <motion.div
            key={i}
            className="redeem-particle"
            initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            animate={{
              opacity: 0,
              y: -Math.random() * 400 - 100,
              x: (Math.random() - 0.5) * 600,
              scale: Math.random() * 1.5 + 0.5,
            }}
            transition={{ duration: Math.random() * 2 + 1.5, delay: Math.random() * 0.5 }}
            style={{
              left: `${Math.random() * 100}%`,
              top: '60%',
              fontSize: `${Math.random() * 1.5 + 0.8}rem`,
            }}
          >
            {['🌱', '⚡', '🪙', '✨', '🌿', '💚'][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="redeem-card glass-card"
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <AnimatePresence mode="wait">

          {/* Loading */}
          {status === 'loading' && (
            <motion.div key="loading" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-spinner" />
              <h2>Verifying Code...</h2>
              <p>Hold tight while we process your reward 🌿</p>
            </motion.div>
          )}

          {/* Waiting for user auth */}
          {status === 'idle' && (
            <motion.div key="idle" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-icon">🔐</div>
              <h2>Authenticating...</h2>
              <p>Please make sure you're logged in.</p>
            </motion.div>
          )}

          {/* Success */}
          {status === 'success' && reward && (
            <motion.div key="success" className="redeem-state" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 250 }}>
              <motion.div
                className="redeem-icon success"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                🎉
              </motion.div>
              <h2>Reward Claimed!</h2>
              <p className="redeem-label">{reward.label}</p>

              <div className="reward-chips">
                <motion.div
                  className="reward-chip points"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="chip-icon">⚡</span>
                  <div>
                    <div className="chip-val">+{reward.points}</div>
                    <div className="chip-name">Eco Points</div>
                  </div>
                </motion.div>

                <motion.div
                  className="reward-chip coins"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <span className="chip-icon">🪙</span>
                  <div>
                    <div className="chip-val">+{reward.coins}</div>
                    <div className="chip-name">Spark Coins</div>
                  </div>
                </motion.div>
              </div>

              <motion.button
                className="redeem-btn"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Go to Dashboard 🚀
              </motion.button>
            </motion.div>
          )}

          {/* Already redeemed */}
          {status === 'already' && (
            <motion.div key="already" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-icon">☑️</div>
              <h2>Already Redeemed</h2>
              <p>{message}</p>
              <button className="redeem-btn secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div key="error" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-icon">❌</div>
              <h2>Invalid Code</h2>
              <p>{message}</p>
              <button className="redeem-btn secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <p className="redeem-brand">EcoSpark 🌿 · Smart India Hackathon 2025</p>
    </div>
  );
}
