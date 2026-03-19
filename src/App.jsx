import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { onUserChange } from './firestore';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Quizzes from './pages/Quizzes';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';
import Profile from './pages/Profile';
import Calculator from './pages/Calculator';
import BadgeUnlockModal from './components/BadgeUnlockModal';
import EcoBuddy from './components/EcoBuddy';
import { ALL_BADGES } from './store';

function ProtectedRoute({ user, loading, children }) {
  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', flexDirection:'column', gap:'1rem',
    }}>
      <div style={{fontSize:'3rem', animation:'float 2s ease-in-out infinite'}}>🌱</div>
      <div style={{color:'var(--color-primary)', fontFamily:'var(--font-display)', fontSize:'1.1rem'}}>
        Loading EcoSpark...
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [newlyEarned, setNewlyEarned] = useState(null);
  const badgesRef = useRef([]);

  useEffect(() => {
    const unsub = onUserChange((userData) => {
      setLoading(false);
      if (userData) {
        const currentBadges = userData.badges || [];
        const oldBadges = badgesRef.current;
        if (oldBadges.length > 0 && currentBadges.length > oldBadges.length) {
          const added = currentBadges.find(id => !oldBadges.includes(id));
          if (added) {
            const badgeObj = ALL_BADGES.find(b => b.id === added);
            setNewlyEarned(badgeObj);
          }
        }
        badgesRef.current = currentBadges;
        setUser(userData);
      } else {
        setUser(null);
        badgesRef.current = [];
      }
    });
    return () => unsub && unsub();
  }, []);

  const refreshUser = () => {
    // Re-fetch from Firebase
    import('firebase/auth').then(({ getAuth }) => {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        import('./firestore').then(({ fbGetUser }) => {
          fbGetUser(currentUser.uid).then(setUser);
        });
      }
    });
  };

  const handleLogout = () => {
    import('./firestore').then(({ fbLogout }) => fbLogout());
    setUser(null);
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <AnimatePresence>
        {newlyEarned && (
          <BadgeUnlockModal 
            badge={newlyEarned} 
            onClose={() => setNewlyEarned(null)} 
          />
        )}
      </AnimatePresence>
      <EcoBuddy />
      <Routes>
        <Route path="/"            element={<Landing user={user} />} />
        <Route path="/auth"        element={user && !loading ? <Navigate to="/dashboard" replace /> : <Auth onAuth={refreshUser} />} />
        <Route path="/dashboard"   element={<ProtectedRoute user={user} loading={loading}><Dashboard user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="/learn"       element={<ProtectedRoute user={user} loading={loading}><Learn user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="/quizzes"     element={<ProtectedRoute user={user} loading={loading}><Quizzes user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="/challenges"  element={<ProtectedRoute user={user} loading={loading}><Challenges user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute user={user} loading={loading}><Leaderboard user={user} /></ProtectedRoute>} />
        <Route path="/badges"      element={<ProtectedRoute user={user} loading={loading}><Badges user={user} /></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute user={user} loading={loading}><Profile user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="/calculator"  element={<ProtectedRoute user={user} loading={loading}><Calculator user={user} onUpdate={refreshUser} /></ProtectedRoute>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
