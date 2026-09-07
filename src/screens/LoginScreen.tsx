import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { ShieldCheck } from 'lucide-react';

export function LoginScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    return localStorage.getItem('copilotofinanc_lgpd_accepted') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [emailLogin, setEmailLogin] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((err: any) => {
      console.error('Erro no retorno do login:', err);
      alert('Erro ao concluir login: ' + (err?.message || err));
    });
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('copilotofinanc_lgpd_accepted', 'true');
    setAcceptedTerms(true);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Erro ao iniciar login com Google:', err);
      alert('Erro ao iniciar login: ' + (err?.message || err));
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin) return;
    try {
      setLoading(true);
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, emailLogin, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailLogin);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      alert('Erro ao enviar e-mail: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Se ainda não aceitou os termos, exibe o modal de LGPD
  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-[#0c1527] flex items-center justify-center p-4">
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-4 text-amber-400">
            <ShieldCheck className="w-8 h-8" />
            <h2 className="text-xl font-bold">Política de Privacidade e Termos</h2>
          </div>
          <div className="text-slate-300 text-sm space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
            <p><strong>1. Coleta e Finalidade dos Dados:</strong> Coletamos apenas seu e-mail de cadastro e dados operacionais do seu caixa com a finalidade exclusiva de exibir relatórios e indicadores no seu painel.</p>
            <p><strong>2. Compartilhamento de Informações:</strong> Seus dados são confidenciais. Não vendemos, não repassamos e não compartilhamos suas informações financeiras com nenhuma outra empresa ou terceiro.</p>
            <p><strong>3. Controle e Direitos (LGPD):</strong> Você pode realizar a exportação integral dos seus dados ou a exclusão permanente e irreversível da sua conta no menu de Perfil.</p>
          </div>
          <button
            type="button"
            onClick={handleAcceptTerms}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition cursor-pointer"
          >
            ✓ Entendi e Concordo com os Termos
          </button>
        </div>
      </div>
    );
  }

  // Após aceitar, exibe a tela de login com os botões
  return (
    <div className="min-h-screen bg-[#0c1527] flex items-center justify-center p-4">
      <div className="bg-[#14223c] border border-slate-700 rounded-2xl max-w-md w-full p-8 text-white shadow-2xl text-center">
        <h1 className="text-2xl font-bold mb-2">Copiloto Financeiro</h1>
        <p className="text-slate-400 text-sm mb-6">Acesse sua conta para continuar</p>

        {loading ? (
          <div className="py-8 text-amber-400 font-medium">Carregando autenticação...</div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <span>Entrar com o Google</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs">ou por e-mail</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {emailSent ? (
              <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl text-emerald-200 text-xs">
                ✓ Link de acesso enviado para o seu e-mail! Verifique sua caixa de entrada.
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Seu e-mail profissional"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition text-sm cursor-pointer"
                >
                  Enviar Link de Acesso por E-mail
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}