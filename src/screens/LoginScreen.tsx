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
        setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-200">Autenticando e abrindo o Copiloto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1329] flex items-center justify-center p-4">
      <div className="bg-[#121c38] p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800 text-white">
        <h1 className="text-2xl font-bold text-center text-amber-400 mb-2">Copiloto Financeiro</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Acesse sua conta para continuar</p>

        {error && (
          <div className="bg-red-500/15 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
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
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Entrar com E-mail
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-gray-700 flex-1" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="h-px bg-gray-700 flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          Entrar com o Google
        </button>
      </div>
    </div>
  );
}