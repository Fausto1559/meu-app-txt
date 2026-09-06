import React from 'react';

interface PrivacidadeProps {
  onAceitar?: () => void;
}

export function Privacidade({ onAceitar }: PrivacidadeProps) {
  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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

        <div className="space-y-4 text-sm text-slate-300">
          <div>
            <h3 className="font-semibold text-slate-200">1. Coleta e Finalidade dos Dados</h3>
            <p>Coletamos apenas seu e-mail de cadastro e dados operacionais do seu caixa com a finalidade exclusiva de exibir relatórios e indicadores no seu painel.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">2. Compartilhamento de Informações</h3>
            <p>Seus dados são confidenciais. Não vendemos, não repassamos e não compartilhamos suas informações financeiras com nenhuma outra empresa ou terceiro.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">3. Controle e Direitos (LGPD)</h3>
            <p>Você pode realizar a exportação integral dos seus dados ou a exclusão permanente e irreversível da sua conta no menu de Perfil.</p>
          </div>
        </div>

        <button 
          className="btn-concordar" 
          onClick={onAceitar}
        >
          ✓ Entendi e Concordo com os Termos
        </button>
      </div>
    </div>
  );
}