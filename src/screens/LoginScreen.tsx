import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { Privacidade } from './Privacidade';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const item = localStorage.getItem('copiloto_lgpd_accepted');
    if (item === 'true') {
      setAcceptedTerms(true);
    }
    setIsChecking(false);
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('copiloto_lgpd_accepted', 'true');
    setAcceptedTerms(true);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      setError('Erro ao fazer login com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Informe seu e-mail.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Link enviado! Verifique sua caixa de entrada.');
    } catch (err: unknown) {
      setError('Erro ao enviar o link por e-mail.');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Privacidade onAceitar={handleAcceptTerms} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Copiloto Financeiro</h1>
          <p className="text-xs text-slate-400 mt-1">Acesse sua conta para continuar</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <span>🌐</span> {loading ? 'Carregando...' : 'Fazer Login com o Google'}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs text-slate-500 uppercase font-semibold">OU</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer border border-slate-700"
          >
            {loading ? 'Enviando...' : 'Receber Link por E-mail'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;