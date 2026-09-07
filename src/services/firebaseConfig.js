import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildSafety",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "copilotofinanc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "copilotofinanc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "copilotofinanc.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123:web:abc"
};

// Inicialização segura do Firebase (evita duplicidade e falhas de runtime)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);