import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBp8LL3SXDRYUGIRTZ4QiX0ZYKhvL808",
  authDomain: "meu-app-copiloto-financeiro.firebaseapp.com",
  projectId: "meu-app-copiloto-financeiro",
  storageBucket: "meu-app-copiloto-financeiro.firebasestorage.app",
  messagingSenderId: "510528690056",
  appId: "1:510528690056:web:68a7b654a60659cea80c3d"
};

// Validação de segurança para garantir que a chave nunca vá vazia
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("undefined")) {
  console.error("ERRO CRÍTICO: A API Key do Firebase não foi carregada corretamente!");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);