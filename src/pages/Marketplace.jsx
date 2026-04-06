import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { fbSpendEcoPoints, fbPlaceOrder } from '../firestore';
import { MARKETPLACE_ITEMS } from '../store';
import emailjs from '@emailjs/browser';
import './Marketplace.css';

const Marketplace = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  
  // Checkout Modal State
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', phone: '' });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (doc) => {
          if (doc.exists()) {
            setUser({ uid: u.uid, email: u.email, ...doc.data() });
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

    if (item.category === 'Digital') {
      try {
        await fbSpendEcoPoints(user.uid, item.price, item.id);
        showToast(`Successfully purchased ${item.name}!`, 'success');
      } catch (err) {
        showToast('Purchase failed. Try again.', 'error');
      }
    } else {
      // Physical items require shipping details & email
      setFormData(prev => ({ ...prev, email: user.email || '' }));
      setCheckoutItem(item);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutItem || !user) return;
    setIsProcessing(true);

    try {
      // 1. Store the order in our database
      await fbPlaceOrder(user.uid, checkoutItem.price, checkoutItem, formData);

      // 2. Send the confirmation email via EmailJS
      await emailjs.send(
        'service_3p385mo', 
        'template_6hwvs78', 
        {
          to_name: formData.name,
          to_email: formData.email,
          item_name: checkoutItem.name,
          user_address: formData.address,
          phone_number: formData.phone,
          message: `Your order for ${checkoutItem.name} has been placed successfully. It will be delivered to: ${formData.address}`
        }, 
        'kYtcuZPTCqgwGknYB'
      );

      showToast(`Order confirmed! Email sent to ${formData.email}`, 'success');
      setCheckoutItem(null);
      setFormData({ name: '', email: '', address: '', phone: '' });
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('Order failed to process. Try again.', 'error');
    } finally {
      setIsProcessing(false);
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

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutItem && (
          <motion.div 
            className="checkout-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && setCheckoutItem(null)}
          >
            <motion.div 
              className="checkout-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal-btn" onClick={() => !isProcessing && setCheckoutItem(null)}>✕</button>
              <h2>Shipping Details</h2>
              <p className="checkout-subtitle">You are redeeming: <strong>{checkoutItem.name}</strong></p>
              
              <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input required type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isProcessing} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isProcessing} />
                </div>
                <div className="form-group">
                  <label>Shipping Address / Room No.</label>
                  <textarea required rows="2" placeholder="Hostel 4, Room 204" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={isProcessing} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input required type="tel" placeholder="+91 9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={isProcessing} />
                </div>
                
                <div className="checkout-actions">
                  <div className="checkout-cost">Total: <span>🪙 {checkoutItem.price}</span></div>
                  <button type="submit" className="confirm-checkout-btn" disabled={isProcessing}>
                    {isProcessing ? 'Processing & Mailing...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
