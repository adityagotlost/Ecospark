import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { fbSpendEcoPoints } from '../firestore';
import { MARKETPLACE_ITEMS } from '../store';
import './Marketplace.css';

const Marketplace = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (doc) => {
          if (doc.exists()) {
            setUser({ uid: u.uid, ...doc.data() });
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleBuy = async (item) => {
    if (!user) return;
    const currentCoins = user.sparkCoins !== undefined ? user.sparkCoins : (user.ecoPoints || 0);
    if (currentCoins < item.price) {
      showToast('Insufficient Eco Coins!', 'error');
      return;
    }

    try {
      await fbSpendEcoPoints(user.uid, item.price, item.id);
      showToast(`Successfully purchased ${item.name}!`, 'success');
    } catch (err) {
      showToast('Purchase failed. Try again.', 'error');
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = ['All', ...new Set(MARKETPLACE_ITEMS.map(i => i.category))];
  const filteredItems = activeTab === 'All' 
    ? MARKETPLACE_ITEMS 
    : MARKETPLACE_ITEMS.filter(i => i.category === activeTab);

  if (loading) {
    return (
      <div className="marketplace-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>🌱</motion.div>
      </div>
    );
  }

  return (
    <div className="page marketplace-page">
      <div className="section anim-fade-up">
        <header className="page-header">
          <div className="marketplace-balance-card">
            <div className="balance-info">
              <span className="balance-label">Your Balance</span>
              <h2 className="balance-value">🪙 {user?.sparkCoins !== undefined ? user.sparkCoins : (user?.ecoPoints || 0)} <span className="pts">Eco Coins</span></h2>
            </div>
            <div className="balance-icon">💰</div>
          </div>
          <h1 className="page-title">Eco Marketplace</h1>
          <p className="page-sub">Redeem your hard-earned EcoPoints for real-world impact and sustainable rewards.</p>
        </header>

        <div className="marketplace-tabs">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="marketplace-grid">
          <AnimatePresence mode='popLayout'>
            {filteredItems.map(item => {
              const isPurchased = user?.purchasedItems?.includes(item.id);
              return (
                <motion.div 
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`market-card ${isPurchased ? 'purchased' : ''}`}
                >
                  <div className="item-image-container">
                    <img src={item.image} alt={item.name} className="item-image" />
                  </div>
                  <div className="item-content">
                    <div className="item-type" style={{ color: item.color }}>{item.category}</div>
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-desc">{item.desc}</p>
                    
                    <div className="item-footer">
                      <div className="item-price">
                        <span className="coin-icon">🪙</span> {item.price}
                      </div>
                      <button 
                        className={`buy-btn ${isPurchased ? 'owned' : ''}`}
                        disabled={isPurchased}
                        onClick={() => handleBuy(item)}
                      >
                        {isPurchased ? 'Owned' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`marketplace-toast ${toast.type}`}
          >
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
