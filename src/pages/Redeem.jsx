import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fbRedeemQrCode } from '../firestore';
import './Redeem.css';

const PARTICLES = Array.from({ length: 20 }, (_, i) => i);

export default function Redeem({ user, loading }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  const [status, setStatus] = useState('idle'); // idle | loading | success | error | already | needsLogin
  const [message, setMessage] = useState('');
  const [reward, setReward] = useState(null);
  const [redeemTriggered, setRedeemTriggered] = useState(false);

  useEffect(() => {
    if (loading) return; // wait for Firebase auth to resolve

    if (!user) {
      // Save the full redeem URL and redirect to login
      sessionStorage.setItem('ecospark_redeem_code', code);
      setStatus('needsLogin');
      return;
    }

    // If user just logged in and a saved code exists, use that
    const savedCode = sessionStorage.getItem('ecospark_redeem_code');
    const finalCode = code || savedCode || '';

    if (!finalCode) {
      setStatus('error');
      setMessage('No redemption code found in this link.');
      return;
    }

    if (!redeemTriggered) {
      setRedeemTriggered(true);
      handleRedeem(finalCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleRedeem = async (finalCode) => {
    setStatus('loading');
    const result = await fbRedeemQrCode(user.uid, finalCode);
    sessionStorage.removeItem('ecospark_redeem_code');
    if (result.success) {
      setReward({ points: result.points, coins: result.coins, label: result.label });
      setStatus('success');
    } else {
      setMessage(result.error);
      setStatus(result.error.toLowerCase().includes('already') ? 'already' : 'error');
    }
  };

  return (
    <div className="redeem-page">
      {/* Confetti particles on success */}
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
            style={{ left: `${Math.random() * 100}%`, top: '60%', fontSize: `${Math.random() * 1.5 + 0.8}rem` }}
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

          {/* Checking auth */}
          {(status === 'idle' || loading) && (
            <motion.div key="idle" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-spinner" />
              <h2>Checking...</h2>
              <p>Verifying your session 🌿</p>
            </motion.div>
          )}

          {/* Not logged in */}
          {status === 'needsLogin' && (
            <motion.div key="needslogin" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-icon">🔐</div>
              <h2>Login to Claim!</h2>
              <p>You've scanned a reward code for</p>
              <div className="code-preview">
                ⚡ 500 Eco Points &nbsp;+&nbsp; 🪙 500 Spark Coins
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Login or create a free account to claim your reward instantly.</p>
              <motion.button
                className="redeem-btn"
                onClick={() => navigate(`/auth?redirect=/redeem?code=${code}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login / Sign Up 🚀
              </motion.button>
            </motion.div>
          )}

          {/* Processing */}
          {status === 'loading' && (
            <motion.div key="loading" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="redeem-spinner" />
              <h2>Claiming Reward...</h2>
              <p>Adding points and coins to your account 🌿</p>
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
                <motion.div className="reward-chip points" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <span className="chip-icon">⚡</span>
                  <div><div className="chip-val">+{reward.points}</div><div className="chip-name">Eco Points</div></div>
                </motion.div>
                <motion.div className="reward-chip coins" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
                  <span className="chip-icon">🪙</span>
                  <div><div className="chip-val">+{reward.coins}</div><div className="chip-name">Spark Coins</div></div>
                </motion.div>
              </div>

              <motion.button className="redeem-btn" onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                Go to Dashboard 🚀
              </motion.button>
            </motion.div>
          )}

          {/* Already redeemed */}
          {status === 'already' && (
            <motion.div key="already" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="redeem-icon">☑️</div>
              <h2>Already Redeemed</h2>
              <p>{message}</p>
              <button className="redeem-btn secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div key="error" className="redeem-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="redeem-icon">❌</div>
              <h2>Invalid Code</h2>
              <p>{message}</p>
              <button className="redeem-btn secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <p className="redeem-brand">EcoSpark 🌿 · TechSangram 2026</p>
    </div>
  );
}
