import React, { useState } from 'react';
import { Mic, CreditCard, Smartphone, Receipt, CheckCircle2 } from 'lucide-react';

export function FechamentoDiario() {
  const [saldoInicial, setSaldoInicial] = useState('');
  const [entradasDinheiro, setEntradasDinheiro] = useState('');
  const [saidasValue, setSaidasValue] = useState('');
  
  const [debitoValue, setDebitoValue] = useState('');
  const [credito3xValue, setCredito3xValue] = useState('');
  const [credito12xValue, setCredito12xValue] = useState('');
  const [pixValue, setPixValue] = useState('');
  const [boletosValue, setBoletosValue] = useState('');

  const formatMoney = (value: string) => {
    if (!value) return '';
    const hasDecimal = value.includes(',') || value.includes('.');
    
    if (hasDecimal) {
      const lastSeparatorIndex = Math.max(value.lastIndexOf(','), value.lastIndexOf('.'));
      const intPart = value.slice(0, lastSeparatorIndex).replace(/\D/g, '');
      const decPart = value.slice(lastSeparatorIndex + 1).replace(/\D/g, '').slice(0, 2);
      
      const cents = (Number(intPart || '0') * 100) + Number(decPart.padEnd(2, '0'));
      const number = cents / 100;
      return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      const onlyNums = value.replace(/\D/g, '');
      if (!onlyNums) return '';
      const number = Number(onlyNums);
      return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const parseMoney = (value: string): number => {
    if (!value) return 0;
    const clean = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(formatMoney(e.target.value));
  };

  const handleVoiceInput = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter(formatMoney(transcript));
    };
    recognition.onerror = () => {
      alert('Erro ao capturar áudio. Tente novamente.');
    };
    recognition.start();
  };

  const nSaldoInicial = parseMoney(saldoInicial);
  const nEntradasDinheiro = parseMoney(entradasDinheiro);
  const nSaidas = parseMoney(saidasValue);

  const saldoFinalEsperado = nSaldoInicial + nEntradasDinheiro - nSaidas;

  const handleFinalizar = () => {
    const novoFechamento = {
      id: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      saldoInicial,
      entradasDinheiro,
      saidasValue,
      debitoValue,
      credito3xValue,
      credito12xValue,
      pixValue,
      boletosValue,
      saldoFinalEsperado: saldoFinalEsperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
    const salvos = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
    localStorage.setItem('copiloto_fechamentos', JSON.stringify([novoFechamento, ...salvos]));
    alert('Fechamento finalizado e enviado para a Central do Contador com sucesso!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">📄</span> Fechamento Diário
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conferência física, validação de maquininhas e encerramento de caixa.
          </p>
        </div>
        <button
          onClick={handleFinalizar}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          Finalizar Fechamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-amber-400">💵</span> Caixa Físico (Dinheiro em Gaveta)
          </h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Saldo Inicial (Abertura/Troco)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={saldoInicial}
                onChange={handleInputChange(setSaldoInicial)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-2 text-white font-bold text-lg focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setSaldoInicial)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-emerald-400 font-medium mb-1">(+) Entradas em Dinheiro</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={entradasDinheiro}
                onChange={handleInputChange(setEntradasDinheiro)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-2 text-white font-bold text-lg focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setEntradasDinheiro)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-rose-400 font-medium mb-1">(-) Saídas (Despesas miúdas/Sangria)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={saidasValue}
                onChange={handleInputChange(setSaidasValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-2 text-white font-bold text-lg focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setSaidasValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-amber-400">📊</span> Resumo do Caixa Físico
            </h2>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>(+) Saldo Inicial:</span>
                <span className="font-semibold text-white">R$ {saldoInicial || '0,00'}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Entradas em Dinheiro:</span>
                <span className="font-semibold text-emerald-400">R$ {entradasDinheiro || '0,00'}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Saídas / Sangria:</span>
                <span className="font-semibold text-rose-400">R$ {saidasValue || '0,00'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#0c1527] border border-slate-700 p-5 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Saldo Final Esperado</span>
            <span className="text-2xl font-bold text-amber-400">
              {saldoFinalEsperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span className="text-amber-400">💳</span> Entradas (Validação de Maquininhas / Sistema)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Cartão de Débito</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={debitoValue}
                onChange={handleInputChange(setDebitoValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setDebitoValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Cartão até 3x</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={credito3xValue}
                onChange={handleInputChange(setCredito3xValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setCredito3xValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Cartão até 12x</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={credito12xValue}
                onChange={handleInputChange(setCredito12xValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setCredito12xValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">PIX</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={pixValue}
                onChange={handleInputChange(setPixValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setPixValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#0c1527] border border-slate-700 p-4 rounded-lg flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Boletos</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">R$</span>
              <input
                type="text"
                value={boletosValue}
                onChange={handleInputChange(setBoletosValue)}
                placeholder="0,00"
                className="w-full bg-[#1e293b] border border-slate-600 rounded-lg pl-10 pr-10 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleVoiceInput(setBoletosValue)}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Falar valor"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}