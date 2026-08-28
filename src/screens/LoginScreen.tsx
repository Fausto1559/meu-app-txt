import React, { useState } from 'react';
import { Privacidade } from './Privacidade';

export function LoginScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(
    () => localStorage.getItem('copiloto_lgpd_accepted') === 'true'
  );

  const handleAcceptTerms = () => {
    localStorage.setItem('copiloto_lgpd_accepted', 'true');
    setAcceptedTerms(true);
  };

  // 1. Se NÃO aceitou os termos, mostra APENAS a Privacidade
  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Privacidade onAccept={handleAcceptTerms} />
      </div>
    );
  }

  // 2. Se JA aceitou os termos, mostra o Login normal
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-white">Copiloto Financeiro</h1>
          <p className="text-xs text-slate-400 mt-1">Acesse sua conta para continuar</p>
        </div>

        <button
          onClick={() => {}}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
        >
          <span>G</span> Fazer Login com o Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs text-slate-500 uppercase">OU</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

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