import { useState } from 'react';
import type { Plan } from '@/types';
import { X, Calculator, Mic, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

interface CalculadoraExpressProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: Plan;
  isTrialActive: boolean;
  onOpenUpgrade: () => void;
}

type FormaPagamento = 'pix' | 'debito' | 'credito_vista' | 'credito_3x' | 'credito_12x';

export default function CalculadoraExpress({
  isOpen,
  onClose,
  userPlan,
  isTrialActive,
  onOpenUpgrade,
}: CalculadoraExpressProps) {
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [custoProduto, setCustoProduto] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [parcelaSelecionada, setParcelaSelecionada] = useState<number>(1);

  if (!isOpen) return null;

  const numericPreco = parseFloat(precoVenda.replace(/\./g, '').replace(',', '.')) || 0;
  const numericCusto = parseFloat(custoProduto.replace(/\./g, '').replace(',', '.')) || 0;

  const taxasParcelamento: Record<number, number> = {
    1: 3.49,
    2: 4.49,
    3: 5.49,
    4: 6.29,
    5: 7.09,
    6: 7.89,
    7: 8.49,
    8: 9.09,
    9: 9.69,
    10: 10.29,
    11: 10.89,
    12: 11.49,
  };

  let taxaPercentual = 0;
  if (formaPagamento === 'pix') taxaPercentual = 0.99;
  else if (formaPagamento === 'debito') taxaPercentual = 1.99;
  else if (formaPagamento === 'credito_vista') taxaPercentual = taxasParcelamento[1];
  else if (formaPagamento === 'credito_3x') taxaPercentual = taxasParcelamento[parcelaSelecionada <= 3 ? parcelaSelecionada : 3];
  else if (formaPagamento === 'credito_12x') taxaPercentual = taxasParcelamento[parcelaSelecionada];

  const valorTaxa = (numericPreco * taxaPercentual) / 100;
  const valorLiquido = numericPreco - valorTaxa;
  const lucro = valorLiquido - numericCusto;
  const margem = numericPreco > 0 ? (lucro / numericPreco) * 100 : 0;

  const canUseCalculator = userPlan !== 'gratis' || isTrialActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0A1428] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-[11px] font-bold text-white tracking-wide uppercase">Calculadora de Balcão Express</h2>
              <p className="text-[9px] text-slate-400">Simule recebimentos e repasse taxas com precisão.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal Compacto (Sem Barra de Rolagem) */}
        <div className="p-3.5 space-y-2.5 overflow-hidden flex-1 text-xs">
          {!canUseCalculator ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
              <h3 className="text-xs font-bold text-white">Recurso Exclusivo do Plano Copiloto</h3>
              <p className="text-[11px] text-slate-300">
                O registro e cálculo avançado de vendas estão habilitados nos planos Copiloto e Alta Performance.
              </p>
              <button
                onClick={onOpenUpgrade}
                className="w-full bg-gradient-to-r from-[#C5A028] to-[#E5C158] text-slate-950 font-bold text-xs py-2 rounded-xl shadow-lg cursor-pointer"
              >
                Fazer Upgrade Agora
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Preço de Venda */}
                <div className="space-y-0.5">
                  <label className="text-[9px] font-semibold text-slate-300 uppercase">PREÇO DE VENDA (R$)</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={precoVenda}
                      onChange={(e) => setPrecoVenda(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <Mic className="absolute right-2 w-3 h-3 text-slate-400 cursor-pointer hover:text-amber-400" />
                  </div>
                </div>

                {/* Custo do Produto */}
                <div className="space-y-0.5">
                  <label className="text-[9px] font-semibold text-slate-300 uppercase">CUSTO DO PRODUTO (R$)</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={custoProduto}
                      onChange={(e) => setCustoProduto(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <Mic className="absolute right-2 w-3 h-3 text-slate-400 cursor-pointer hover:text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-slate-300 uppercase">FORMA DE PAGAMENTO</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setFormaPagamento('pix'); setParcelaSelecionada(1); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      formaPagamento === 'pix' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Pix (0.99%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormaPagamento('debito'); setParcelaSelecionada(1); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      formaPagamento === 'debito' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Débito (1.99%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormaPagamento('credito_vista'); setParcelaSelecionada(1); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      formaPagamento === 'credito_vista' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Créd. à Vista ({taxasParcelamento[1]}%)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => { setFormaPagamento('credito_3x'); setParcelaSelecionada(1); }}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-between transition-all cursor-pointer ${
                      formaPagamento === 'credito_3x' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Crédito Parcelado (Até 3x)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setFormaPagamento('credito_12x'); setParcelaSelecionada(1); }}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-between transition-all cursor-pointer ${
                      formaPagamento === 'credito_12x' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Crédito Parcelado (Até 12x)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Seletor Compacto 3x ou 12x */}
                {(formaPagamento === 'credito_3x' || formaPagamento === 'credito_12x') && (
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg p-2 space-y-1 mt-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">
                      Selecione a quantidade de parcelas ({formaPagamento === 'credito_3x' ? '1 a 3x' : '1 a 12x'}):
                    </div>
                    <div className={`grid ${formaPagamento === 'credito_3x' ? 'grid-cols-3' : 'grid-cols-6'} gap-1`}>
                      {Array.from({ length: formaPagamento === 'credito_3x' ? 3 : 12 }, (_, i) => i + 1).map((num) => {
                        const tx = taxasParcelamento[num];
                        const valParcela = numericPreco > 0 ? (numericPreco * (1 + tx / 100)) / num : 0;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setParcelaSelecionada(num)}
                            className={`p-1 rounded-md text-center border transition-all cursor-pointer ${
                              parcelaSelecionada === num
                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="text-[9px] font-bold">{num}x</div>
                            <div className="text-[8px] opacity-80">{tx}%</div>
                            <div className="text-[8px] font-mono mt-0.5">R$ {valParcela.toFixed(0)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo da Venda Compacto */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="font-sans text-[9px] uppercase tracking-wider">Resumo da Venda ({parcelaSelecionada}x)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Taxa aplicada ({taxaPercentual}%):</span>
                  <span className="text-red-400">- R$ {valorTaxa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[10px]">
                  <span>Valor Líquido Recebido:</span>
                  <span className="text-white font-bold">R$ {valorLiquido.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-[10px]">
                  <span className="text-slate-300">Lucro Estimado:</span>
                  <span className={lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    R$ {lucro.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Margem:</span>
                  <span className={margem >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {margem.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Botão Salvar */}
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#C5A028] to-[#E5C158] hover:opacity-90 text-slate-950 font-bold text-[11px] py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-[#C5A028]/25 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CONFIRMAR E SALVAR VENDA</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}