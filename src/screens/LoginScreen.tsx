import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebaseConfig';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => console.error("Erro redirect:", err));
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Erro ao entrar com e-mail. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        setError('O login com o Google foi cancelado.');
      } else {
        setError('Ocorreu um erro ao tentar entrar com o Google.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1329] flex items-center justify-center p-4">
      <div className="bg-[#121c38] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800 text-white">
        <h1 className="text-2xl font-bold text-center text-amber-400 mb-2">Copiloto Financeiro</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Acesse sua conta para continuar</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#0b1329] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#0b1329] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-semibold rounded-lg text-gray-950 transition-colors cursor-pointer"
          >
            Entrar com E-mail
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <span className="relative px-2 bg-[#121c38] text-xs text-gray-400">ou</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-white hover:bg-gray-100 font-semibold rounded-lg text-gray-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          Entrar com o Google
        </button>
      </div>
    </div>
  );
}