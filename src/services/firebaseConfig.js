import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyBp8LL3SXDRYUGIRTZ4QiX0ZYKhvL808",
  authDomain: "meu-app-txt.firebaseapp.com",
  projectId: "meu-app-txt",
  storageBucket: "meu-app-txt.firebasestorage.app",
  messagingSenderId: "510528690056",
  appId: "1:510528690056:web:68a7b654a60659cea80c3d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);