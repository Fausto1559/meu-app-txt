import { useState, useEffect } from 'react';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { Crown } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Por favor, confirme seu e-mail para concluir o login:');
      }

      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setError(`Erro ao concluir login com link: ${err.message}`);
            setLoading(false);
          });
      }
    }
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Link enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(`Erro ao enviar link: ${err.message}`);
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
      setError(`Erro no login com Google: ${err.message}`);
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
          <p className="text-xs text-slate-400">Entre sem senha usando seu e-mail ou Google</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs text-center font-medium break-words">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-xs text-center font-medium break-words">
            {message}
          </div>
        )}

        <form onSubmit={handleSendMagicLink} className="space-y-4">
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            {loading ? 'Enviando...' : 'Enviar Link por E-mail'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider">ou continue com</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div>
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Entrar com Google</span>
          </button>
        </div>

      </div>
    </div>
  );
}