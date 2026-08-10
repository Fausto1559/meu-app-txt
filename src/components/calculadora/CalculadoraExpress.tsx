import React, { useState, useEffect } from 'react';
import { X, Settings, Mic, Check } from 'lucide-react';

interface CalculadoraExpressProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSale?: (saleData: any) => void;
}

export default function CalculadoraExpress({ isOpen, onClose, onSaveSale }: CalculadoraExpressProps) {
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [custoProduto, setCustoProduto] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'debito' | 'credito_vista' | 'parc_3x' | 'parc_12x'>('pix');
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState<number>(1);
  const [showTaxSettings, setShowTaxSettings] = useState<boolean>(false);

  // Tabela de taxas padrão editável
  const [taxas, setTaxas] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('copiloto_taxas_personalizadas');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      pix: 0.99,
      debito: 1.99,
      credito_vista: 3.49,
      parc_1: 4.49,
      parc_2: 5.29,
      parc_3: 5.99,
      parc_4: 6.99,
      parc_5: 7.99,
      parc_6: 8.99,
      parc_7: 9.99,
      parc_8: 10.99,
      parc_9: 11.49,
      parc_10: 11.99,
      parc_11: 12.49,
      parc_12: 12.99,
    };
  });

  useEffect(() => {
    localStorage.setItem('copiloto_taxas_personalizadas', JSON.stringify(taxas));
  }, [taxas]);

  if (!isOpen) return null;

  const getTaxaAtual = (): number => {
    if (formaPagamento === 'pix') return taxas.pix || 0;
    if (formaPagamento === 'debito') return taxas.debito || 0;
    if (formaPagamento === 'credito_vista') return taxas.credito_vista || 0;
    return taxas[`parc_${parcelasSelecionadas}`] || 0;
  };

  const taxaAplicadaPercent = getTaxaAtual();
  const numVenda = parseFloat(precoVenda.replace(',', '.')) || 0;
  const numCusto = parseFloat(custoProduto.replace(',', '.')) || 0;

  const valorTaxa = (numVenda * taxaAplicadaPercent) / 100;
  const valorLiquido = numVenda - valorTaxa;
  const lucroEstimado = valorLiquido - numCusto;
  const margem = numVenda > 0 ? (lucroEstimado / numVenda) * 100 : 0;

  const handleSalvarVenda = () => {
    if (onSaveSale && numVenda > 0) {
      onSaveSale({
        precoVenda: numVenda,
        custoProduto: numCusto,
        formaPagamento,
        parcelas: parcelasSelecionadas,
        taxaPercent: taxaAplicadaPercent,
        valorTaxa,
        valorLiquido,
        lucroEstimado,
        margem,
        data: new Date().toISOString()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative text-white shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <span className="text-amber-400 text-lg font-bold">⚡</span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">CALCULADORA DE BALCÃO EXPRESS</h2>
              <p className="text-xs text-slate-400">Simule recebimentos e ajuste suas taxas.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTaxSettings(!showTaxSettings)}
              className={`p-2 rounded-lg border transition-colors ${showTaxSettings ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Painel de Edição de Taxas */}
        {showTaxSettings && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ajustar Suas Taxas (%)</h3>
              <button 
                onClick={() => setShowTaxSettings(false)}
                className="text-[11px] bg-amber-500 text-slate-950 px-2 py-1 rounded font-bold"
              >
                Salvar Taxas
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><label className="text-slate-400">Pix (%):</label><input type="number" step="0.01" value={taxas.pix} onChange={e => setTaxas({...taxas, pix: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white mt-0.5" /></div>
              <div><label className="text-slate-400">Débito (%):</label><input type="number" step="0.01" value={taxas.debito} onChange={e => setTaxas({...taxas, debito: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white mt-0.5" /></div>
              <div><label className="text-slate-400">Créd. à Vista (%):</label><input type="number" step="0.01" value={taxas.credito_vista} onChange={e => setTaxas({...taxas, credito_vista: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white mt-0.5" /></div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <div key={n}><label className="text-slate-400">{n}x (%):</label><input type="number" step="0.01" value={taxas[`parc_${n}`]} onChange={e => setTaxas({...taxas, [`parc_${n}`]: parseFloat(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white mt-0.5" /></div>
              ))}
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preço de Venda (R$)</label>
            <div className="relative">
              <input type="text" placeholder="0,00" value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              <Mic className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Custo do Produto (R$)</label>
            <div className="relative">
              <input type="text" placeholder="0,00" value={custoProduto} onChange={e => setCustoProduto(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              <Mic className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Forma de Pagamento</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button onClick={() => { setFormaPagamento('pix'); setParcelasSelecionadas(1); }} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${formaPagamento === 'pix' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'}`}>
              Pix ({taxas.pix}%)
            </button>
            <button onClick={() => { setFormaPagamento('debito'); setParcelasSelecionadas(1); }} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${formaPagamento === 'debito' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'}`}>
              Débito ({taxas.debito}%)
            </button>
            <button onClick={() => { setFormaPagamento('credito_vista'); setParcelasSelecionadas(1); }} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${formaPagamento === 'credito_vista' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'}`}>
              Créd. à Vista ({taxas.credito_vista}%)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setFormaPagamento('parc_3x'); setParcelasSelecionadas(3); }} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${formaPagamento === 'parc_3x' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'}`}>
              Parcelado (Até 3x) ({taxas.parc_3}%)
            </button>
            <button onClick={() => { setFormaPagamento('parc_12x'); setParcelasSelecionadas(12); }} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${formaPagamento === 'parc_12x' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'}`}>
              Parcelado (Até 12x) ({taxas.parc_12}%)
            </button>
          </div>
        </div>

        {/* Submenu de Parcelas Dinâmico */}
        {(formaPagamento === 'parc_3x' || formaPagamento === 'parc_12x') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Selecione o número de parcelas:</span>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {Array.from({ length: formaPagamento === 'parc_3x' ? 3 : 12 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setParcelasSelecionadas(n)}
                  className={`p-2 rounded-lg text-xs font-semibold flex justify-between items-center transition-all ${parcelasSelecionadas === n ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  <span>{n}x</span>
                  <span className="text-[10px] opacity-80">{taxas[`parc_${n}`]}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-3">
            <Check className="w-4 h-4" />
            <span>RESUMO ({taxaAplicadaPercent}% TX - {parcelasSelecionadas}x)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400"><span>Taxa aplicada:</span><span className="text-red-400 font-mono">- R$ {valorTaxa.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-200"><span>Valor Líquido:</span><span className="font-bold font-mono">R$ {valorLiquido.toFixed(2)}</span></div>
            <div className="flex justify-between text-emerald-400 font-bold"><span>Lucro Estimado:</span><span className="font-mono">R$ {lucroEstimado.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800"><span>Margem:</span><span className="font-bold text-slate-200">{margem.toFixed(1)}%</span></div>
          </div>
        </div>

        <button onClick={handleSalvarVenda} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-colors uppercase tracking-wider">
          CONFIRMAR E SALVAR VENDA
        </button>
      </div>
    </div>
  );
}