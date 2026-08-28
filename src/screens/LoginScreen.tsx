import React, { useState } from 'react';
import { 
  sendSignInLinkToEmail, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth'; 

import { auth } from '../services/firebaseConfig';
import { Crown } from 'lucide-react';
import { Privacidade } from './Privacidade';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Trava LGPD
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(
    () => localStorage.getItem('copiloto_lgpd_accepted') === 'true'
  );

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
    } catch (err: any) {
      console.error(err);
      setError('Erro ao fazer login com o Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
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
      setMessage('Link de acesso enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 1. ETAPA LGPD: Se não aceitou, mostra a Política de Privacidade
  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Privacidade onAccept={handleAcceptTerms} />
      </div>
    );
  }

  // 2. ETAPA LOGIN: Exibe a tela após o aceite
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6">
        
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
        </div>

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
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>G</span> {loading ? 'Carregando...' : 'Fazer Login com o Google'}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs text-slate-500 uppercase">OU</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
          >
            {loading ? 'Enviando...' : 'Receber Link de Acesso por E-mail'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginScreen;