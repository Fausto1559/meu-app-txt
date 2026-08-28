import React from 'react';

export function Privacidade({ onClose }: { onClose?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex justify-center">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 self-start my-8">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white">Política de Privacidade - Copiloto Financeiro</h1>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
          )}
        </div>

        {/* Conteúdo com Texto Claro */}
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <p>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), este documento descreve como tratamos e protegemos os seus dados na plataforma.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Coleta e Finalidade dos Dados</h2>
            <p>
              Coletamos seu e-mail de cadastro e dados operacionais de caixa exclusivamente para renderizar relatórios, gráficos e indicadores do seu negócio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Compartilhamento de Informações</h2>
            <p>
              Seus dados não são vendidos, alugados ou compartilhados com terceiros. As conexões de Open Finance servem unicamente para a sincronização de leitura do seu próprio fluxo de caixa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Exclusão e Direitos do Usuário (LGPD)</h2>
            <p>
              Você possui o direito de exportar todos os seus dados a qualquer momento ou solicitar a exclusão definitiva da sua conta diretamente no painel de Perfil e Configurações.
            </p>
          </section>
        </div>

        {/* Botão de Voltar */}
        <div className="pt-4 border-t border-slate-800">
          <a
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all text-center"
          >
            ← Voltar para o Dashboard
          </a>
        </div>

      </div>
    </div>
  );
}

export default Privacidade;