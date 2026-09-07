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

let app;
let authInstance: any = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

export const auth = authInstance;