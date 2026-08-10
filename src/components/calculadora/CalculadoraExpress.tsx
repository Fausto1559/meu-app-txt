import React, { useState } from 'react';
import { X, Flame, Mic, Settings, Check } from 'lucide-react';

interface CalculadoraExpressProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSale?: (saleData: any) => void;
  userPlan?: string;
  isTrialActive?: boolean;
  onOpenUpgrade?: () => void;
}

export default function CalculadoraExpress({ isOpen, onClose, onSaveSale }: CalculadoraExpressProps) {
  if (!isOpen) return null;
  
  const [precoVenda, setPrecoVenda] = useState('');
  const [custoProduto, setCustoProduto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'debito' | 'creditoVista' | 'parc3x' | 'parc12x'>('creditoVista');
  
  const [rates, setRates] = useState({
    pix: 0.99,
    debito: 1.99,
    creditoVista: 3.49,
    parc3x: 5.99,
    parc12x: 12.99,
  });

  const [showTaxSettings, setShowTaxSettings] = useState(false);

  const handleSpeechInput = (setter: (val: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.replace(/\D/g, '');
      if (transcript) {
        const formatted = (Number(transcript) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        setter(formatted);
      }
    };
    recognition.start();
  };

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const vVenda = parseCurrency(precoVenda);
  const vCusto = parseCurrency(custoProduto);

  const currentRate = rates[formaPagamento];
  const taxaValor = vVenda * (currentRate / 100);
  const valorLiquido = vVenda - taxaValor;
  const lucroEstimado = valorLiquido - vCusto;
  const margem = vVenda > 0 ? (lucroEstimado / vVenda) * 100 : 0;

  const handleSave = () => {
    if (onSaveSale) {
      onSaveSale({
        precoVenda: vVenda,
        custoProduto: vCusto,
        formaPagamento,
        taxaAplicada: currentRate,
        valorLiquido,
        lucroEstimado
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-xl bg-[#0A1428] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">CALCULADORA DE BALCÃO EXPRESS</h2>
              <p className="text-[11px] text-slate-400">Simule recebimentos e ajuste suas taxas com precisão.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTaxSettings(!showTaxSettings)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Configurar Taxas"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Painel de Configuração de Taxas */}
          {showTaxSettings && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Configurar Taxas das Operações (%)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400">Pix</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rates.pix} 
                    onChange={(e) => setRates({...rates, pix: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white" 
                  />
                </div>
                <div>
                  <label className="text-slate-400">Débito</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rates.debito} 
                    onChange={(e) => setRates({...rates, debito: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white" 
                  />
                </div>
                <div>
                  <label className="text-slate-400">Créd. à Vista</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rates.creditoVista} 
                    onChange={(e) => setRates({...rates, creditoVista: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white" 
                  />
                </div>
                <div>
                  <label className="text-slate-400">Parcelado Até 3x</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rates.parc3x} 
                    onChange={(e) => setRates({...rates, parc3x: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white" 
                  />
                </div>
                <div>
                  <label className="text-slate-400">Parcelado Até 12x</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rates.parc12x} 
                    onChange={(e) => setRates({...rates, parc12x: Number(e.target.value)})}
                    className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Inputs de Valores com Microfone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">PREÇO DE VENDA (R$)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={precoVenda} 
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 pr-10 font-mono" 
                />
                <button 
                  onClick={() => handleSpeechInput(setPrecoVenda)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Falar valor"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">CUSTO DO PRODUTO (R$)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={custoProduto} 
                  onChange={(e) => setCustoProduto(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 pr-10 font-mono" 
                />
                <button 
                  onClick={() => handleSpeechInput(setCustoProduto)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Falar valor"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">FORMA DE PAGAMENTO</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'pix', label: `Pix (${rates.pix}%)` },
                { id: 'debito', label: `Débito (${rates.debito}%)` },
                { id: 'creditoVista', label: `Créd. à Vista (${rates.creditoVista}%)` },
                { id: 'parc3x', label: `Parcelado (Até 3x) (${rates.parc3x}%)` },
                { id: 'parc12x', label: `Parcelado (Até 12x) (${rates.parc12x}%)` },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFormaPagamento(item.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all font-medium ${
                    formaPagamento === item.id 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Check className="w-4 h-4" />
              <span>RESUMO ({currentRate}%)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxa aplicada:</span>
              <span className="text-red-400 font-mono">- R$ {taxaValor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Valor Líquido:</span>
              <span className="font-mono text-white">R$ {valorLiquido.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Lucro Estimado:</span>
              <span className="font-mono text-emerald-400">R$ {lucroEstimado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-1.5">
              <span>Margem:</span>
              <span className="font-mono text-amber-400">{margem.toFixed(1)}%</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C5A028] to-[#E5C158] text-slate-950 font-bold text-xs hover:opacity-90 transition-all shadow-lg"
          >
            CONFIRMAR E SALVAR VENDA
          </button>
        </div>

      </div>
    </div>
  );
}