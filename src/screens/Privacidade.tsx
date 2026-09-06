import React from 'react';

interface PrivacidadeProps {
  onAceitar?: () => void;
}

export function Privacidade({ onAceitar }: PrivacidadeProps) {
  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-slate-100">
            Política de Privacidade e Termos
          </h2>
          <button
            type="button"
            onClick={handleReject}
            className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <h3 className="font-semibold text-slate-200">1. Coleta e Finalidade dos Dados</h3>
            <p className="mt-1 text-slate-400">Coletamos apenas seu e-mail de cadastro e dados operacionais do seu caixa com a finalidade exclusiva de exibir relatórios e indicadores no seu painel.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">2. Compartilhamento de Informações</h3>
            <p className="mt-1 text-slate-400">Seus dados são confidenciais. Não vendemos, não repassamos e não compartilhamos suas informações financeiras com nenhuma outra empresa ou terceiro.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">3. Controle e Direitos (LGPD)</h3>
            <p className="mt-1 text-slate-400">Você pode realizar a exportação integral dos seus dados ou a exclusão permanente e irreversível da sua conta no menu de Perfil.</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onAceitar}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-lg"
        >
          ✓ Entendi e Concordo com os Termos
        </button>
      </div>
    </div>
  );
}