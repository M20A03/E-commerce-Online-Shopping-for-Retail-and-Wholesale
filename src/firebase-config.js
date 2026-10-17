// IMPROVEMENT: Safe Firebase initialization with try/catch fallback for AppCheck and auth/firestore exports
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCSqLi9Iu3CeYOfNH7yPCX32LTyXUR-MBQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "react4-eb851.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "react4-eb851",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "react4-eb851.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "438069281435",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:438069281435:web:cfd2d4e5ae3c1706d0fc3e",
  measurementId: "G-G6VQK5EBKX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let appCheckInstance = null;
try {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
  if (recaptchaSiteKey && typeof window !== 'undefined') {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
} catch (e) {
  console.warn('AppCheck initialization skipped:', e);
}

export const appCheck = appCheckInstance;
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enforce browser local persistence to eliminate session drops on page reload
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Failed to set browser local persistence:', err);
  });
}

export default app;
