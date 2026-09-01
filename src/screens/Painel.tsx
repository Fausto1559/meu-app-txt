import React, { useState } from 'react';
import { Mic, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Plan, ConnectedMachine, ReceivableItem, PayableItem } from '../types/index';

interface PainelProps {
  plan?: Plan;
  connectedMachines?: ConnectedMachine[];
  receivables?: ReceivableItem[];
  setReceivables?: React.Dispatch<React.SetStateAction<ReceivableItem[]>>;
  payables?: PayableItem[];
  setPayables?: React.Dispatch<React.SetStateAction<PayableItem[]>>;
  aReceber?: string | number;
  vendasHoje?: number;
  setVendasHoje?: React.Dispatch<React.SetStateAction<number>>;
  onSaleBooked?: (amount: number) => void;
  onNavigateToConexao?: () => void;
}

export default function Painel({
  plan,
  connectedMachines,
  receivables,
  setReceivables,
  payables,
  setPayables,
  aReceber,
  vendasHoje,
  setVendasHoje,
  onNavigateToConexao,
}: PainelProps) {
  const [listeningField, setListeningField] = useState<'aReceber' | 'aPagar' | null>(null);
  const [aReceberTotal, setAReceberTotal] = useState<number>(0);
  const [aReceberItens, setAReceberItens] = useState<string[]>([]);
  const [aPagarTotal, setAPagarTotal] = useState<number>(0);
  const [aPagarItens, setAPagarItens] = useState<string[]>([]);

  const handleVoiceInput = (field: 'aReceber' | 'aPagar') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Navegador sem suporte a reconhecimento de voz.');
      return;
    }

    setListeningField(field);
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript;
      const numeros = texto.match(/\d+(?:[.,]\d+)?/g);
      const valor = numeros ? parseFloat(numeros[0].replace(',', '.')) : 0;

      if (field === 'aReceber') {
        if (valor > 0) setAReceberTotal(prev => prev + valor);
        setAReceberItens(prev => [texto, ...prev]);
      } else {
        if (valor > 0) setAPagarTotal(prev => prev + valor);
        setAPagarItens(prev => [texto, ...prev]);
      }
      setListeningField(null);
    };

    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);
    recognition.start();
  };

  const atualizarItemAReceber = (index: number, novoTexto: string) => {
    setAReceberItens(prev => {
      const copia = [...prev];
      copia[index] = novoTexto;
      const novoTotal = copia.reduce((acc, curr) => {
        const nums = curr.match(/\d+(?:[.,]\d+)?/g);
        return acc + (nums ? parseFloat(nums[0].replace(',', '.')) : 0);
      }, 0);
      setAReceberTotal(novoTotal);
      return copia;
    });
  };

  const atualizarItemAPagar = (index: number, novoTexto: string) => {
    setAPagarItens(prev => {
      const copia = [...prev];
      copia[index] = novoTexto;
      const novoTotal = copia.reduce((acc, curr) => {
        const nums = curr.match(/\d+(?:[.,]\d+)?/g);
        return acc + (nums ? parseFloat(nums[0].replace(',', '.')) : 0);
      }, 0);
      setAPagarTotal(novoTotal);
      return copia;
    });
  };

  const removerItemAReceber = (index: number) => {
    const item = aReceberItens[index];
    const numeros = item.match(/\d+(?:[.,]\d+)?/g);
    const valor = numeros ? parseFloat(numeros[0].replace(',', '.')) : 0;
    if (valor > 0) setAReceberTotal(prev => Math.max(0, prev - valor));
    setAReceberItens(prev => prev.filter((_, i) => i !== index));
  };

  const removerItemAPagar = (index: number) => {
    const item = aPagarItens[index];
    const numeros = item.match(/\d+(?:[.,]\d+)?/g);
    const valor = numeros ? parseFloat(numeros[0].replace(',', '.')) : 0;
    if (valor > 0) setAPagarTotal(prev => Math.max(0, prev - valor));
    setAPagarItens(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* LINHA 1: INDICADORES PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        {/* Vendas Hoje */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm">Vendas Hoje</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            R$ {(vendasHoje || 0).toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-xs text-slate-500">Nenhuma maquininha conectada</p>
        </div>

        {/* A Receber (Total Geral) */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm">A Receber</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mb-1">
            R$ {aReceberTotal.toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-xs text-slate-500">Valores pendentes</p>
        </div>

        {/* A Pagar (Total Geral) */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm">A Pagar</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-rose-400 mb-1">
            R$ {aPagarTotal.toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-xs text-slate-500">Contas em aberto</p>
        </div>

        {/* Saldo Previsto */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm">Saldo Previsto</span>
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-blue-400 mb-1">
            R$ {(aReceberTotal - aPagarTotal).toFixed(2).replace('.', ',')}
          </h3>
          <p className="text-xs text-slate-500">Balanço geral</p>
        </div>
      </div>

      {/* LINHA 2: BANNER DE MAQUININHAS */}
      <div className="bg-[#0f292e] border border-emerald-900/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">Gerencie e adicione novas maquininhas de cartão ativas ao seu plano atual.</span>
        </div>
        <button
          onClick={onNavigateToConexao}
          className="px-4 py-2 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded-lg text-emerald-400 text-sm transition-colors whitespace-nowrap"
        >
          Conectar Maquininhas
        </button>
      </div>

      {/* LINHA 3: UM ÚNICO CONTAINER (DUAS COLUNAS LADO A LADO) COM MICROFONES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        
        {/* CONTAS A RECEBER */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Contas a Receber</h3>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                R$ {aReceberTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleVoiceInput('aReceber')}
              className={`p-3.5 rounded-xl transition-all ${
                listeningField === 'aReceber'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-emerald-400'
              }`}
            >
              <Mic className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 min-h-[50px] max-h-[140px] overflow-y-auto space-y-1">
            {aReceberItens.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Diga ex: "Receber da Padaria R$ 100"</p>
            ) : (
              aReceberItens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/50 last:border-0 gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-emerald-500 font-bold">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => atualizarItemAReceber(i, e.target.value)}
                      className="w-full bg-transparent text-emerald-300 text-xs border-b border-transparent hover:border-slate-700 focus:border-emerald-400 focus:bg-slate-800/50 focus:outline-none transition-all px-1 py-0.5 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removerItemAReceber(i)}
                    className="text-slate-500 hover:text-red-400 font-bold px-2 py-0.5 rounded transition-colors"
                    title="Apagar este item"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CONTAS A PAGAR */}
        <div className="bg-[#14223c] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Contas a Pagar</h3>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">
                R$ {aPagarTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleVoiceInput('aPagar')}
              className={`p-3.5 rounded-xl transition-all ${
                listeningField === 'aPagar'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-rose-400'
              }`}
            >
              <Mic className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 min-h-[50px] max-h-[140px] overflow-y-auto space-y-1">
            {aPagarItens.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Diga ex: "Pagar energia R$ 150"</p>
            ) : (
              aPagarItens.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/50 last:border-0 gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-rose-500 font-bold">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => atualizarItemAPagar(i, e.target.value)}
                      className="w-full bg-transparent text-rose-300 text-xs border-b border-transparent hover:border-slate-700 focus:border-rose-400 focus:bg-slate-800/50 focus:outline-none transition-all px-1 py-0.5 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removerItemAPagar(i)}
                    className="text-slate-500 hover:text-red-400 font-bold px-2 py-0.5 rounded transition-colors"
                    title="Apagar este item"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}