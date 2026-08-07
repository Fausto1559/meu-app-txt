import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { Crown } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("ERRO DO FIREBASE:", err.code, err.message);
      if (err.code === 'auth/api-key-not-valid.') {
        setError('Erro de configuração: Chave de API do Firebase inválida.');
      } else {
        setError(`Erro ao entrar: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("ERRO GOOGLE:", err.code, err.message);
      setError(`Erro no login com Google: ${err.message}`);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("ERRO FACEBOOK:", err.code, err.message);
      setError(`Erro no login com Facebook: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A1428] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Crown className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider">Copiloto Financeiro</h1>
          <p className="text-xs text-slate-400">Entre com sua conta para gerenciar seu negócio</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs text-center font-medium break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            {loading ? 'Entrando...' : 'Entrar com E-mail'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider">ou continue com</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="space-y-2.5">
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Entrar com Google</span>
          </button>

          <button 
            onClick={handleFacebookLogin}
            type="button"
            className="w-full bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-blue-300 font-medium py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Entrar com Facebook</span>
          </button>
        </div>

      </div>
    </div>
  );
}