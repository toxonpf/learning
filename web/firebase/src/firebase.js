// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD_6FhRq5VLM4qN0ICePy0Dsk64IC9XPsY',
  authDomain: 'first-7b836.firebaseapp.com',
  projectId: 'first-7b836',
  storageBucket: 'first-7b836.firebasestorage.app',
  messagingSenderId: '760075721925',
  appId: '1:760075721925:web:c6b476e5bfdd943d5fe4ac',
  measurementId: 'G-739TQC89Y3',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;