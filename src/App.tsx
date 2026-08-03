import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function App() {
  const [showBalcaoModal, setShowBalcaoModal] = useState<boolean>(true);
  const [precoVenda, setPrecoVenda] = useState<string>('100');
  const [custoProduto, setCustoProduto] = useState<string>('40');
  const [formaPagamento, setFormaPagamento] = useState<string | null>('pix');
  const [parcelaSelecionada, setParcelaSelecionada] = useState<number | null>(null);
  const [resumoBalcaoAtivo, setResumoBalcaoAtivo] = useState<boolean>(true);
  const [showDescontoPanel, setShowDescontoPanel] = useState<boolean>(false);
  const [descontoPercent, setDescontoPercent] = useState<number>(0);
  const [descontoValor, setDescontoValor] = useState<number>(0);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [vendasHoje, setVendasHoje] = useState<number>(0);
  const [totalRecebido, setTotalRecebido] = useState<number>(0);

  const isEntradaVozDisponivel = false;
  const ativarEntradaPorVoz = () => {};

  const precoVendaNumero = Number(precoVenda.replace(',', '.')) || 0;
  const custoProdutoNumero = Number(custoProduto.replace(',', '.')) || 0;
  const camposBalcaoValidos = precoVendaNumero > 0 && custoProdutoNumero > 0;

  const taxaPercentual = formaPagamento === 'pix' ? 0.99 : formaPagamento === 'debito' ? 1.99 : formaPagamento === 'credito_vista' ? 3.49 : 4.99;
  const taxaValor = Number(((precoVendaNumero * taxaPercentual) / 100).toFixed(2));
  const valorLiquido = Number((precoVendaNumero - taxaValor).toFixed(2));
  const lucroReal = Number((valorLiquido - custoProdutoNumero).toFixed(2));
  const margemLucro = precoVendaNumero > 0 ? ((lucroReal / precoVendaNumero) * 100).toFixed(1) : '0';

  const chavePixExemplo = '00020126360014br.gov.bcb.pix...';
  const parcelasDisponiveis = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleSelecionarFormaPagamento = (id: string) => {
    setFormaPagamento(id);
    setResumoBalcaoAtivo(true);
  };

  const handleSelecionarParcela = (parcela: number) => {
    setParcelaSelecionada(parcela);
  };

  const handleConfirmarVendaBalcao = () => {
    setVendasHoje((prev) => prev + precoVendaNumero);
    setTotalRecebido((prev) => prev + precoVendaNumero);
    setShowBalcaoModal(false);
    setPrecoVenda('');
    setCustoProduto('');
    setFormaPagamento(null);
    setParcelaSelecionada(null);
    setResumoBalcaoAtivo(false);
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex items-center justify-center p-4">
      <button
        onClick={() => setShowBalcaoModal(true)}
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-4 py-3 rounded-2xl shadow-lg transition-all"
      >
        Abrir Calculadora de Balcão Express
      </button>

      {/* MODAL: CALCULADORA DE BALCÃO EXPRESS */}
      {showBalcaoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07101F] border border-slate-800 rounded-3xl w-full max-w-[95vw] sm:max-w-xl p-3 text-slate-100 shadow-2xl max-h-[85vh] overflow-hidden overflow-x-hidden flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-black text-amber-400">Calculadora de Balcão Express</h2>
                <p className="text-[11px] text-slate-400 mt-1">Preencha os valores para liberar as formas de pagamento.</p>
              </div>
              <button
                onClick={() => {
                  setShowBalcaoModal(false);
                  setFormaPagamento(null);
                  setParcelaSelecionada(null);
                  setResumoBalcaoAtivo(false);
                }}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto overflow-x-hidden pr-2 flex-1" style={{ maxHeight: 'calc(85vh - 7.5rem)' }}>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Preço de Venda (R$)
              </label>
              <div className="relative">
                <input
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-700 bg-[#020814] text-sm text-white px-3.5 pr-14 py-2 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setPrecoVenda('')}
                  className="absolute inset-y-0 right-9 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Limpar Preço de Venda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={ativarEntradaPorVoz}
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-sm text-slate-400"
                >
                  {isEntradaVozDisponivel ? '🎙️' : '🔒'}
                </button>
              </div>

              {/* Simulador de Desconto */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDescontoPanel((s) => !s)}
                  className="rounded-2xl border px-2.5 py-1.5 text-[11px] font-bold bg-[#091123] text-slate-200 border-slate-700 hover:border-amber-500 hover:text-white"
                >
                  Cliente pediu desconto?
                </button>
                {showDescontoPanel && (
                  <div className="bg-[#06121A] border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={descontoPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDescontoPercent(val);
                          setDescontoValor(0);
                        }}
                        placeholder="% desconto"
                        className="w-28 rounded-md bg-[#020814] text-white px-2 py-1 border border-slate-700"
                      />
                      <span className="text-slate-400">ou</span>
                      <input
                        type="number"
                        value={descontoValor}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDescontoValor(val);
                          setDescontoPercent(0);
                        }}
                        placeholder="R$ desconto"
                        className="w-32 rounded-md bg-[#020814] text-white px-2 py-1 border border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Custo do Produto (R$)
              </label>
              <div className="relative">
                <input
                  value={custoProduto}
                  onChange={(e) => setCustoProduto(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-700 bg-[#020814] text-sm text-white px-3.5 pr-14 py-2 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setCustoProduto('')}
                  className="absolute inset-y-0 right-9 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Limpar Custo do Produto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'pix', label: 'PIX' },
                  { id: 'debito', label: 'Débito' },
                  { id: 'credito_vista', label: 'Crédito à Vista' },
                  { id: 'credito_parcelado', label: 'Crédito Parcelado' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelecionarFormaPagamento(option.id)}
                    disabled={!camposBalcaoValidos}
                    className={`rounded-2xl border px-2.5 py-1.5 text-[10px] font-bold transition-all min-h-[36px] ${
                      camposBalcaoValidos
                        ? formaPagamento === option.id
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-[#091123] text-slate-200 border-slate-700 hover:border-amber-500 hover:text-white'
                        : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {formaPagamento === 'credito_parcelado' && camposBalcaoValidos && (
                <div className="bg-[#08131F] border border-slate-800 rounded-3xl p-2.5 text-[10px] text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-200">TABELA DE PARCELAMENTO</span>
                    <span className="text-slate-500">Taxa {taxaPercentual.toFixed(2)}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {parcelasDisponiveis.map((parcela) => (
                      <button
                        key={parcela}
                        type="button"
                        onClick={() => handleSelecionarParcela(parcela)}
                        className={`rounded-2xl border px-2 py-1 text-[10px] font-bold transition-all ${
                          parcelaSelecionada === parcela
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-[#091123] text-slate-300 border-slate-700 hover:border-amber-500 hover:text-white'
                        }`}
                      >
                        {parcela}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {resumoBalcaoAtivo && camposBalcaoValidos && (
                <div className="bg-[#08131F] border border-slate-800 rounded-3xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Preço Informado:</span>
                    <span className="text-white font-bold">R$ {precoVendaNumero.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Custo do Produto:</span>
                    <span className="text-white font-bold">R$ {custoProdutoNumero.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Taxa da Operação ({taxaPercentual.toFixed(2)}%):</span>
                    <span className="text-rose-400 font-bold">- R$ {taxaValor.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Valor Líquido Recebido:</span>
                    <span className="text-emerald-400 font-black">R$ {valorLiquido.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                    <span className="text-slate-200 font-bold">Lucro Líquido Real:</span>
                    <span className={`font-black text-sm ${lucroReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {lucroReal.toFixed(2)} ({margemLucro}% de margem)
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-2 border-t border-slate-800 pt-2 sticky bottom-0 bg-[#07101F]">
                <button
                  onClick={handleConfirmarVendaBalcao}
                  disabled={!camposBalcaoValidos || !formaPagamento}
                  className={`w-full rounded-2xl text-xs font-black py-3 transition-all shadow-md ${
                    camposBalcaoValidos && formaPagamento
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Confirmar e Salvar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marca d'água */}
      <div className="fixed bottom-6 right-6 bg-white text-slate-950 px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-50 flex items-center gap-1 border border-slate-200">
        <span className="text-slate-900 font-extrabold">Made in Bolt</span><span className="text-indigo-600">⚡</span>
      </div>
    </div>
  );
}