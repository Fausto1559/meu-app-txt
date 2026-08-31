import React, { useState } from 'react';
import { Mic } from 'lucide-react';
// src/screens/Painel.tsx
import { parseBRL, Plan, ConnectedMachine, ReceivableItem, PayableItem } from '../types/index';
// Altere a segunda linha de acordo com a localização exata do arquivo de types (exemplo: '../types' ou '../types/index')
import { DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface PainelProps {
  plan?: Plan;
  connectedMachines?: ConnectedMachine[];
  receivables?: Array<{ id: string; description: string; dueDate: string; amount: number; received: boolean }>;
  [key: string]: any;
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

  const totalReceivables = (receivables ?? [])
    .filter((r) => !r.received)
    .reduce((acc, r) => acc + r.amount, 0);

  const totalPayables = (payables ?? [])
    .filter((p) => !p.paid)
    .reduce((acc, p) => acc + parseBRL(p.amount), 0);

  const saldoPrevisto = totalReceivables + vendasHoje - totalPayables;

  function toggleReceive(id: string) {
    setReceivables((prev) =>
      prev.map((r) => (r.id === id ? { ...r, received: !r.received } : r))
    );
  }

  function togglePay(id: string) {
    setPayables((prev) =>
      prev.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p))
    );
  }

  function handleClearVendas() {
    if (window.confirm("Tem certeza? Apagar o conteúdo desse campo?")) {
      setVendasHoje(0);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold text-[#E5C158] tracking-wide">
          Suas prioridades de hoje
        </h2>
        <p className="text-xs text-slate-400">
          Selecionamos as ações mais urgentes para colocar dinheiro na caixa e evitar prejuízos. Resolva na ordem — cada minuto conta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md relative group">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Vendas Hoje</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearVendas}
                title="Tem certeza? Apagar o conteúdo desse campo?"
                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <DollarSign className="w-4 h-4 text-[#E5C158]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {typeof vendasHoje === 'number' ? vendasHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (vendasHoje || 'R$ 0,00')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {connectedMachines?.length > 0 ? `${connectedMachines.length} maquininha(s) ativa(s)` : 'Nenhuma maquininha conectada'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>A Receber</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {Number(aReceber ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Valores pendentes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>A Pagar</span>
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {Number(totalPayables ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Contas em aberto</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Saldo Previsto</span>
            <RefreshCw className="w-4 h-4 text-[#E5C158]" />
          </div>
          <div className={`text-2xl font-bold ${saldoPrevisto >= 0 ? 'text-white' : 'text-red-400'}`}>
            {isNaN(Number(saldoPrevisto)) ? 'R$ 0,00' : Number(saldoPrevisto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Balanço geral</p>
        </div>
      </div>

      {plan === 'gratis' ? (
        <div className="bg-[#C5A028]/10 border border-[#C5A028]/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#E5C158]" />
            <p className="text-xs text-slate-300">
              Conecte suas maquininhas de cartão para automatizar o fluxo de vendas diárias.
            </p>
          </div>
          <button
            onClick={onNavigateToConexao}
            className="bg-[#C5A028]/20 hover:bg-[#C5A028]/30 border border-[#C5A028]/40 text-[#E5C158] text-xs font-medium px-4 py-2 rounded-lg transition-all"
          >
            Conectar Maquininhas
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-xs text-slate-300">
              Gerencie e adicione novas maquininhas de cartão ativas ao seu plano atual.
            </p>
          </div>
          <button
            onClick={onNavigateToConexao}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-medium px-4 py-2 rounded-lg transition-all"
          >
            Conectar Maquininhas
          </button>
        </div>
      )}
    </div>
  );
}