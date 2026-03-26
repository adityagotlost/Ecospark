// ================================================
// Firebase Data Store
// Replaces localStorage with Firebase Auth + Firestore
// ================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, orderBy, limit, getDocs, increment, arrayUnion, onSnapshot,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ALL_BADGES } from './store';

// ── Auth ──────────────────────────────────────────────────────

export async function fbRegister({ name, email, password, school, grade }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;
  const userData = {
    uid, name, email,
    school:    school || 'Green Valley School',
    grade:     grade  || '10th',
    avatar:    name.charAt(0).toUpperCase(),
    ecoPoints: 0,
    streak:    1,
    joinedAt:  new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    completedLessons:    [],
    completedChallenges: [],
    completedQuizzes:    [],
    badges:              [],
    weeklyPoints:        [0, 0, 0, 0, 0, 0, 0],
    ecoStations:         [],
  };
  await setDoc(doc(db, 'users', uid), userData);
  return userData;
}

export async function fbLogin({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;
  let snap = await getDoc(doc(db, 'users', uid));

  if (!snap.exists()) {
    // Re-create user data if it was accidentally deleted
    const userData = {
      uid, 
      email: cred.user.email,
      name: cred.user.displayName || email.split('@')[0],
      school: 'Eco High School', // default
      grade: '10th', // default
      avatar: (cred.user.displayName || email).charAt(0).toUpperCase(),
      ecoPoints: 0,
      streak: 1,
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      completedLessons: [],
      completedChallenges: [],
      completedQuizzes: [],
      badges: [],
      weeklyPoints: [0, 0, 0, 0, 0, 0, 0],
      ecoStations: [],
    };
    await setDoc(doc(db, 'users', uid), userData);
    // Fetch it again to be safe
    snap = await getDoc(doc(db, 'users', uid));
  }

  const user = snap.data();

  // Streak logic
  const lastLogin  = new Date(user.lastLogin);
  const today      = new Date();
  const diffDays   = Math.floor((today - lastLogin) / 86400000);
  const newStreak  = diffDays === 1 ? (user.streak || 0) + 1 : diffDays > 1 ? 1 : (user.streak || 1);

  await updateDoc(doc(db, 'users', uid), {
    lastLogin: today.toISOString(),
    streak:    newStreak,
  });
  return { ...user, streak: newStreak };
}

export function fbLogout() {
  return signOut(auth);
}

export async function fbResetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function onUserChange(callback) {
  let unsubUser = null;
  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
    if (unsubUser) { unsubUser(); unsubUser = null; }
    if (firebaseUser) {
      unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        } else {
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  });
  return () => {
    unsubAuth();
    if (unsubUser) unsubUser();
  };
}

// To allow manual unsubscribe if needed
export function subscribeUserData(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) callback(doc.data());
  });
}

// ── User data helpers ─────────────────────────────────────────

export async function fbGetUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function fbUpdateUser(uid, updates) {
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function fbUpdateProfile(uid, name, photoDataUrl) {
  const updates = { name };
  if (photoDataUrl) {
    updates.photoURL = photoDataUrl;
  }
  await fbUpdateUser(uid, updates);
  return updates;
}

// ── Eco Points ────────────────────────────────────────────────

export async function fbAddEcoPoints(uid, points) {
  const user = await fbGetUser(uid);
  if (!user) return [];
  const today = new Date().getDay();
  let weeklyData = user.weeklyPoints || [0, 0, 0, 0, 0, 0, 0];
  if (!Array.isArray(weeklyData)) {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    Object.keys(weeklyData).forEach(k => arr[parseInt(k)] = weeklyData[k] || 0);
    weeklyData = arr;
  }
  weeklyData[today] += points;

  await updateDoc(doc(db, 'users', uid), {
    ecoPoints:  increment(points),
    weeklyPoints: weeklyData,
  });
  return fbCheckAndAwardBadges(uid);
}

// ── Lessons ───────────────────────────────────────────────────

export async function fbCompleteLesson(uid, lessonId, points = 50) {
  await updateDoc(doc(db, 'users', uid), {
    completedLessons: arrayUnion(lessonId),
  });
  await fbAddEcoPoints(uid, points);
}

// ── Challenges ────────────────────────────────────────────────

export async function fbCompleteChallenge(uid, challengeId, points = 100) {
  await updateDoc(doc(db, 'users', uid), {
    completedChallenges: arrayUnion(challengeId),
  });
  await fbAddEcoPoints(uid, points);
}

// ── Quizzes ───────────────────────────────────────────────────

export async function fbCompleteQuiz(uid, quizId, score, total) {
  const user = await fbGetUser(uid);
  if (!user) return;

  const validScore = Math.min(score, total);
  const newPoints = Math.round((validScore / total) * 80);

  const existingQuizzes = user.completedQuizzes || [];
  const existingIdx = existingQuizzes.findIndex(q => q.quizId === quizId);

  if (existingIdx >= 0) {
    const oldAttempt = existingQuizzes[existingIdx];
    if (validScore > oldAttempt.score) {
      // higher score achieved
      const oldPoints = Math.round((oldAttempt.score / oldAttempt.total) * 80);
      const pointsDiff = newPoints - oldPoints;
      
      existingQuizzes[existingIdx] = { quizId, score: validScore, total };
      await updateDoc(doc(db, 'users', uid), {
        completedQuizzes: existingQuizzes,
      });
      if (pointsDiff > 0) {
        await fbAddEcoPoints(uid, pointsDiff);
      }
    }
  } else {
    // first attempt
    existingQuizzes.push({ quizId, score: validScore, total });
    await updateDoc(doc(db, 'users', uid), {
      completedQuizzes: existingQuizzes,
    });
    await fbAddEcoPoints(uid, newPoints);
  }
}

// ── Eco-Stations (QR) ──────────────────────────────────────────

export async function fbScanEcoStation(uid, stationId, points = 100) {
  const user = await fbGetUser(uid);
  if (!user) return [];
  if (user.ecoStations?.includes(stationId)) return []; // Already scanned
  
  await updateDoc(doc(db, 'users', uid), {
    ecoStations: arrayUnion(stationId),
  });
  return fbAddEcoPoints(uid, points);
}

// ── Badges ────────────────────────────────────────────────────

export async function fbCheckAndAwardBadges(uid) {
  const user     = await fbGetUser(uid);
  if (!user) return [];
  const earned   = user.badges || [];
  const newBadges = ALL_BADGES
    .filter(b => !earned.includes(b.id) && b.condition(user))
    .map(b => b.id);
  if (newBadges.length > 0) {
    await updateDoc(doc(db, 'users', uid), {
      badges: arrayUnion(...newBadges),
    });
    return newBadges;
  }
  return [];
}

// ── Leaderboard ───────────────────────────────────────────────

export function onLeaderboardChange(callback) {
  const q = query(collection(db, 'users'), orderBy('ecoPoints', 'desc'), limit(25));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => {
      const u = d.data();
      return {
        id:        u.uid,
        name:      u.name,
        school:    u.school,
        avatar:    u.avatar,
        photoURL:  u.photoURL,
        ecoPoints: u.ecoPoints || 0,
        badges:    u.badges?.length || 0,
      };
    });
    callback(list);
  });
}
