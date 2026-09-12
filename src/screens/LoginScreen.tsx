import React, { useState, useEffect } from 'react';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export function LoginScreen() {
  const [etapa, setEtapa] = useState<'lgpd' | 'login'>('lgpd');
  const [processando, setProcessando] = useState(true); // Começa true para processar o retorno

  useEffect(() => {
    // 1. Captura o usuário voltando da tela do Google
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Se voltou com usuário, não faz nada e deixa o App.tsx redirecionar pro painel
          return;
        }
        // Se não tem usuário voltando, libera a tela de login
        setProcessando(false);
      })
      .catch((error) => {
        console.error("Erro no retorno do Google:", error);
        setProcessando(false);
      });

    // 2. Verifica a LGPD
    if (localStorage.getItem('lgpd_aceito') === 'true') {
      setEtapa('login');
    }
  }, []);

  const handleAceitarLgpd = () => {
    localStorage.setItem('lgpd_aceito', 'true');
    setEtapa('login');
  };

  const handleGoogleLogin = () => {
    setProcessando(true);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  if (processando) {
    return (
      <div className="min-h-screen bg-[#0c1527] flex items-center justify-center">
        <p className="text-amber-400 font-bold">Processando login seguro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1527] flex items-center justify-center p-4">
      {etapa === 'lgpd' ? (
        <div className="bg-[#14223c] border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Política de Privacidade e Termos</h2>
          <div className="space-y-3 text-sm text-slate-300 mb-6">
            <p><strong>1. Coleta e Finalidade:</strong> Coletamos apenas seu e-mail e dados operacionais para exibir relatórios no painel.</p>
            <p><strong>2. Privacidade:</strong> Seus dados são confidenciais e nunca vendidos ou repassados a terceiros.</p>
            <p><strong>3. Direitos (LGPD):</strong> Você pode exportar ou excluir seus dados a qualquer momento pelo menu de perfil.</p>
          </div>
          <button
            type="button"
            onClick={handleAceitarLgpd}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition cursor-pointer"
          >
            ✓ Entendi e Concordo com os Termos
          </button>
        </div>
      ) : (
        <div className="bg-[#14223c] border border-slate-800 rounded-2xl max-w-md w-full p-8 text-slate-100 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-amber-400 mb-2">Copiloto Financeiro</h1>
          <p className="text-sm text-slate-400 mb-6">Acesse sua conta para continuar</p>
          
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 shadow-md cursor-pointer"
          >
            <span>Entrar com o Google</span>
          </button>
        </div>
      )}
    </div>
  );
}