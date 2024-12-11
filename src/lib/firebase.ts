// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';  // 추가

const firebaseConfig = {
  apiKey: "AIzaSyDReEZ7oMTNBhz9a0BbYuyRBp4cbAbkTyk",
  authDomain: "semis-ntcbd.firebaseapp.com",
  projectId: "semis-ntcbd",
  storageBucket: "semis-ntcbd.firebasestorage.app",
  messagingSenderId: "251622399573",
  appId: "1:251622399573:web:c6f501d10118f457cafedc",
  measurementId: "G-N7CGJEQRSD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);  // 추가