import React from 'react';

interface PrivacidadeProps {
  onClose?: () => void;
  onAccept?: () => void;
}

export function Privacidade({ onClose, onAccept }: PrivacidadeProps) {
  const handleCloseAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAccept) onAccept();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl w-full max-w-xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-slate-100">
          Política de Privacidade e Termos
        </h2>
        <button
          type="button"
          onClick={handleCloseAction}
          className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Conteúdo LGPD Resumido */}
      <div className="space-y-4 text-xs text-slate-300 max-h-60 overflow-y-auto pr-2 leading-relaxed">
        <div>
          <h3 className="font-semibold text-slate-100 mb-1 text-sm">
            1. Coleta e Finalidade dos Dados
          </h3>
          <p>
            Coletamos apenas seu e-mail de cadastro e dados operacionais do seu caixa com a finalidade exclusiva de exibir relatórios e indicadores no seu painel.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-1 text-sm">
            2. Compartilhamento de Informações
          </h3>
          <p>
            Seus dados são confidenciais. Não vendemos, não repassamos e não compartilhamos suas informações financeiras com nenhuma outra empresa ou terceiro.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-1 text-sm">
            3. Controle e Direitos (LGPD)
          </h3>
          <p>
            Você pode realizar a exportação integral dos seus dados ou a exclusão permanente e irreversível da sua conta no menu de Perfil.
          </p>
        </div>
      </div>

      {/* Botão Único de Aceite */}
      <div className="pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleCloseAction}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
        >
          ✓ Entendi e Concordo com os Termos
        </button>
      </div>

    </div>
  );
}

export default Privacidade;