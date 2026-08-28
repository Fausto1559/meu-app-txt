import { useState, useEffect } from 'react';
import { Privacidade } from './Privacidade';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { Crown } from 'lucide-react';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificação inicial: checa se o usuário já aceitou os termos no navegador
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(
    () => localStorage.getItem('copiloto_lgpd_accepted') === 'true'
  );

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

const handleAcceptTerms = () => {
    localStorage.setItem('copiloto_lgpd_accepted', 'true');
    setAcceptedTerms(true);
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

  // PASSO 1: Se ainda não aceitou, exibe apenas o Termo de Privacidade
  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Privacidade onAccept={handleAcceptTerms} />
      </div>
    );
  }

  // PASSO 2: Após o aceite, carrega a tela de login normal (Google / E-mail)
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-white">Copiloto Financeiro</h1>
          <p className="text-xs text-slate-400 mt-1">Acesse sua conta para continuar</p>
        </div>

        {/* Botão Google */}
        <button
          onClick={/* Sua função de login Google */ () => {}}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
        >
          <span>G</span> Fazer Login com o Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs text-slate-500 uppercase">OU</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Formulário Email */}
        <form className="space-y-3">
          <input
            type="email"
            placeholder="seu.email@exemplo.com"
            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all"
          >
            Receber Link de Acesso por E-mail
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginScreen;