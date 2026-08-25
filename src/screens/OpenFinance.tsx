import React, { useState } from 'react';
import { Cpu, CheckCircle2, XCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface Maquininha {
  id: string;
  nome: string;
  taxaDebito: string;
  taxaCredito: string;
  status: 'conectado' | 'desconectado';
  ultimaSincronizacao?: string;
}

export function OpenFinance() {
  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([
    { id: '1', nome: 'Mercado Pago', taxaDebito: '1,99%', taxaCredito: '3,49%', status: 'desconectado' },
    { id: '2', nome: 'PagBank', taxaDebito: '1,38%', taxaCredito: '3,15%', status: 'desconectado' },
    { id: '3', nome: 'Cielo', taxaDebito: '1,99%', taxaCredito: '4,49%', status: 'desconectado' },
    { id: '4', nome: 'Stone', taxaDebito: '1,75%', taxaCredito: '3,30%', status: 'desconectado' },
    { id: '5', nome: 'Rede', taxaDebito: '1,98%', taxaCredito: '3,98%', status: 'desconectado' },
    { id: '6', nome: 'Getnet', taxaDebito: '2,00%', taxaCredito: '4,10%', status: 'desconectado' },
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleConexao = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      setMaquininhas(prev =>
        prev.map(m => {
          if (m.id === id) {
            const novoStatus = m.status === 'conectado' ? 'desconectado' : 'conectado';
            return {
              ...m,
              status: novoStatus,
              ultimaSincronizacao: novoStatus === 'conectado' ? new Date().toLocaleTimeString() : undefined
            };
          }
          return m;
        })
      );
      setLoadingId(null);
    }, 1000);
  };

const [consentAccepted, setConsentAccepted] = useState(false);

const handleOpenFinanceConnect = () => {
  if (!consentAccepted) {
    alert("Você precisa aceitar os termos de consentimento da LGPD para continuar.");
    return;
  }
  // Lógica de integração bancária aqui
};

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-[#16223f] border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Open Finance & Conectar Maquininhas</h2>
              <p className="text-sm text-slate-400">Sincronize suas vendas e taxas de recebimento em tempo real de forma segura.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Ambiente Criptografado e Seguro
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {maquininhas.map((maq) => {
            const isConectado = maq.status === 'conectado';
            const isLoading = loadingId === maq.id;

            return (
              <div 
                key={maq.id} 
                className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isConectado 
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-white">{maq.nome}</h3>
                    {isConectado ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 text-xs font-medium bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                        <XCircle className="w-3.5 h-3.5" /> Desconectado
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxa Débito:</span>
                      <span className="font-semibold text-white">{maq.taxaDebito}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxa Crédito:</span>
                      <span className="font-semibold text-white">{maq.taxaCredito}</span>
                    </div>
                    {maq.ultimaSincronizacao && (
                      <div className="flex justify-between pt-2 border-t border-slate-800 text-[11px] text-emerald-300">
                        <span>Última Sincronização:</span>
                        <span>{maq.ultimaSincronizacao}</span>
                      </div>
                    )}
                  </div>
                </div>

<div className="flex items-center gap-2 my-4">
  <input 
    type="checkbox" 
    id="lgpdConsent"
    checked={consentAccepted}
    onChange={(e) => setConsentAccepted(e.target.checked)}
  />
  <label htmlFor="lgpdConsent" className="text-sm">
    Autorizo a coleta e processamento de dados financeiros exclusivamente para geração de relatórios neste aplicativo, conforme a LGPD.
  </label>
</div>

                <button
                  onClick={() => handleToggleConexao(maq.id)}
                  disabled={isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isConectado
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Conectando...
                    </>
                  ) : isConectado ? (
                    'Desconectar Maquininha'
                  ) : (
                    'Conectar via Open Finance'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}