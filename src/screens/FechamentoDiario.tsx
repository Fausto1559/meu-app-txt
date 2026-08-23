import React, { useState } from 'react';
import { FileText, CheckCircle, Wallet, Calculator, CreditCard, Smartphone, Receipt, AlertCircle, Mic } from 'lucide-react';

export function FechamentoDiario() {
    const [conferenciaGaveta, setConferenciaGaveta] = useState('');
    const [entradasValue, setEntradasValue] = useState('');
    const handleVoiceInput = (setter: (val: string) => void) => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      alert('Navegador incompatível.');
      return;
    }
    const recognition = new SpeechAPI();
    recognition.lang = 'pt-BR';
    recognition.onresult = (ev: any) => {
      setter(ev.results[0][0].transcript);
    };
    recognition.start();
  };
  return (
    <div className="flex flex-col gap-6 mt-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            Fechamento Diário
          </h2>
          <p className="text-sm text-slate-400 mt-1">Conferência física, validação de maquininhas e encerramento de caixa.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg">
          <CheckCircle className="w-5 h-5" />
          Finalizar Fechamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-md flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
            <Wallet className="w-5 h-5 text-amber-400" />
            Caixa Físico (Dinheiro em Gaveta)
          </h3>
          <div className="flex justify-between items-center text-slate-300 mt-2">
            <span>Saldo Inicial (Abertura/Troco)</span>
            <span className="font-medium">R$ 0,00</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span>(+) Entradas em Dinheiro</span>
            <span className="font-medium">R$ 0,00</span>
          </div>
          <div className="flex justify-between items-center text-red-400">
            <span>(-) Saídas (Despesas miúdas/Sangria)</span>
            <span className="font-medium">R$ 0,00</span>
          </div>
          <div className="flex justify-between items-center text-white bg-[#0c1527] p-4 rounded-lg border border-slate-700 mt-2">
            <span className="font-bold">Saldo Final Esperado</span>
            <span className="font-bold text-xl text-amber-400">R$ 0,00</span>
          </div>
          <div className="mt-4 bg-[#0c1527]/50 p-4 rounded-lg border border-slate-700 border-dashed">
  <label className="block text-sm font-medium text-slate-300 mb-2">Conferência Física Real (Gaveta)</label>
  <div className="relative flex items-center">
    <span className="absolute left-3 text-slate-400 font-bold">R$</span>
    <input
    
      type="text"
      placeholder="0,00"
      className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-2 text-white font-bold"
    />
    <button
      type="button"
      onClick={(e) => {
        const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
        const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechAPI) {
          const recognition = new SpeechAPI();
          recognition.lang = 'pt-BR';
          recognition.onresult = (ev: any) => {
            if (inputEl) {
              inputEl.value = ev.results[0][0].transcript;
              inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
          };
          recognition.start();
        }
      }}
      className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors"
    >
      <Mic className="w-4 h-4" />
    </button>
  </div>
</div>

        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-md flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
            <Calculator className="w-5 h-5 text-amber-400" />
            Entradas (Validação de Maquininhas/Sistema)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Cartão de Crédito</span>
              </div>
              <div className="relative flex items-center mt-1">
  <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
  <input
    type="text"
    value={entradasValue}
    onChange={(e) => setEntradasValue(e.target.value)}
    placeholder="0,00"
    className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg"
  />
  <button
    type="button"
    onClick={() => handleVoiceInput(setEntradasValue)}
    className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors"
  >
    <Mic className="w-4 h-4" />
  </button>
</div>
            </div>
            <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Cartão de Débito</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ 0,00</p>
            </div>
            <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">PIX</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ 0,00</p>
            </div>
            <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Boletos</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ 0,00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Lançamentos Registrados pelo App
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-600 rounded-lg bg-[#0c1527]/50">
          <AlertCircle className="w-10 h-10 mb-3 text-slate-500" />
          <p className="font-medium text-slate-300">Nenhuma movimentação para exibir ainda.</p>
        </div>
      </div>
    </div>
  </div>
  );
}