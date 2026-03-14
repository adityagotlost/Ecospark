import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPG5Z4ykY_UnlhiZw5jD8AGm32eV_HuTk",
  authDomain: "ecospark-1a4af.firebaseapp.com",
  projectId: "ecospark-1a4af",
  storageBucket: "ecospark-1a4af.firebasestorage.app",
  messagingSenderId: "656503169110",
  appId: "1:656503169110:web:10a19dccefc3cb8b1e9bf7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
