import React, { useState, useEffect } from 'react';
import { Download, Calendar, Trash2 } from 'lucide-react';

export function CentralContador() {
  const [fechamentos, setFechamentos] = useState<any[]>([]);

  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
    setFechamentos(salvos);
  }, []);

  const parseNum = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const totalGeralDinheiro = fechamentos.reduce((acc, f) => acc + parseNum(f.entradasDinheiro), 0);
  const totalGeralDebito = fechamentos.reduce((acc, f) => acc + parseNum(f.debitoValue), 0);
  const totalGeralCredito3x = fechamentos.reduce((acc, f) => acc + parseNum(f.credito3xValue), 0);
  const totalGeralCredito12x = fechamentos.reduce((acc, f) => acc + parseNum(f.credito12xValue), 0);
  const totalGeralPix = fechamentos.reduce((acc, f) => acc + parseNum(f.pixValue), 0);
  const totalGeralBoletos = fechamentos.reduce((acc, f) => acc + parseNum(f.boletosValue), 0);
  const totalGeralSaidas = fechamentos.reduce((acc, f) => acc + parseNum(f.saidasValue), 0);

  const faturamentoTotal = totalGeralDinheiro + totalGeralDebito + totalGeralCredito3x + totalGeralCredito12x + totalGeralPix + totalGeralBoletos;

  const limparHistorico = () => {
    if (confirm('Deseja realmente limpar todos os fechamentos salvos?')) {
      localStorage.removeItem('copiloto_fechamentos');
      setFechamentos([]);
    }
  };

  const exportarRelatorio = () => {
    const relatorio = `--- RELATÓRIO CONSOLIDADO PARA CONTABILIDADE ---\n` +
      `Total de Fechamentos: ${fechamentos.length}\n` +
      `Faturamento Total: ${faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
      `- Dinheiro: R$ ${totalGeralDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- Débito: R$ ${totalGeralDebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- Crédito 3x: R$ ${totalGeralCredito3x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- Crédito 12x: R$ ${totalGeralCredito12x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- PIX: R$ ${totalGeralPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- Boletos: R$ ${totalGeralBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `- Total Saídas/Sangrias: R$ ${totalGeralSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    
    navigator.clipboard.writeText(relatorio);
    alert('Relatório copiado para a área de transferência!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-amber-400">📁</span> Central do Contador
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidado e somatório automático de todos os fechamentos diários realizados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportarRelatorio}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            Copiar Relatório p/ Contador
          </button>
          <button
            onClick={limparHistorico}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-800 font-medium px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111c32] border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Faturamento Consolidado</span>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{fechamentos.length} fechamento(s) registrado(s)</span>
        </div>

        <div className="bg-[#111c32] border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total PIX + Dinheiro</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {(totalGeralPix + totalGeralDinheiro).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Dinheiro: R$ {totalGeralDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | PIX: R$ {totalGeralPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-[#111c32] border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Cartões (Déb/Créd)</span>
          <div className="text-2xl font-bold text-cyan-400 mt-2">
            {(totalGeralDebito + totalGeralCredito3x + totalGeralCredito12x).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Débito e Crédito parcelado</span>
        </div>

        <div className="bg-[#111c32] border border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Saídas / Sangrias</span>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {totalGeralSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Despesas miúdas do período</span>
        </div>
      </div>

      <div className="bg-[#111c32] border border-slate-800 rounded-xl overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calendar className="w-5 h-5 text-amber-400" /> Histórico de Fechamentos Diários
        </h2>

        {fechamentos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Nenhum fechamento diário finalizado ainda. Vá em "Fechamento Diário" e clique em "Finalizar Fechamento".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0c1527] text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Dinheiro (Entrada)</th>
                  <th className="p-3">PIX</th>
                  <th className="p-3">Cartões</th>
                  <th className="p-3">Boletos</th>
                  <th className="p-3">Saídas</th>
                  <th className="p-3">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fechamentos.map((f, idx) => {
                  const cartoes = parseNum(f.debitoValue) + parseNum(f.credito3xValue) + parseNum(f.credito12xValue);
                  return (
                    <tr key={idx} className="hover:bg-[#16223f] transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {f.data}
                      </td>
                      <td className="p-3 text-emerald-400">R$ {f.entradasDinheiro || '0,00'}</td>
                      <td className="p-3">R$ {f.pixValue || '0,00'}</td>
                      <td className="p-3">R$ {cartoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3">R$ {f.boletosValue || '0,00'}</td>
                      <td className="p-3 text-rose-400">R$ {f.saidasValue || '0,00'}</td>
                      <td className="p-3 font-bold text-amber-400">{f.saldoFinalEsperado}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}