import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, CreditCard, Truck, Copy, Send, Calendar, Trash2 } from 'lucide-react';

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

  // Cálculos consolidados a partir do histórico
  const totalDinheiro = fechamentos.reduce((acc, f) => acc + parseNum(f.entradasDinheiro), 0);
  const totalPix = fechamentos.reduce((acc, f) => acc + parseNum(f.pixValue), 0);
  const totalDebito = fechamentos.reduce((acc, f) => acc + parseNum(f.debitoValue), 0);
  const totalCredito3x = fechamentos.reduce((acc, f) => acc + parseNum(f.credito3xValue), 0);
  const totalCredito12x = fechamentos.reduce((acc, f) => acc + parseNum(f.credito12xValue), 0);
  const totalBoletos = fechamentos.reduce((acc, f) => acc + parseNum(f.boletosValue), 0);
  const totalSaidas = fechamentos.reduce((acc, f) => acc + parseNum(f.saidasValue), 0);

  const faturamentoBruto = totalDinheiro + totalPix + totalDebito + totalCredito3x + totalCredito12x + totalBoletos;
  const taxasCartao = (totalDebito * 0.0199) + (totalCredito3x * 0.0499) + (totalCredito12x * 0.1299); // Lógica de estimativa de taxa
  const despesas = totalSaidas;

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
  const anoAtual = new Date().getFullYear();
  const mesFormatado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  const mensagemContador = `Prezado(a) contador(a), segue o resumo operacional do meu negócio referente ao mês de ${mesFormatado} de ${anoAtual}. Faturamento Bruto: ${formatarMoeda(faturamentoBruto)}. Total Pago em Taxas de Cartão: ${formatarMoeda(taxasCartao)}. Despesas Operacionais: ${formatarMoeda(despesas)}. Os extratos de Open Finance e XMLs de vendas consolidados estão anexados à plataforma. Fico à disposição para ajustes na guia do Simples.`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagemContador);
    alert('Mensagem copiada para a área de transferência!');
  };

  const handleWhatsApp = () => {
    const textoUrl = encodeURIComponent(mensagemContador);
    window.open(`https://wa.me/?text=${textoUrl}`, '_blank');
  };

  const limparHistorico = () => {
    if (confirm('Deseja realmente limpar todos os fechamentos salvos?')) {
      localStorage.removeItem('copiloto_fechamentos');
      setFechamentos([]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* BLOCO 1: RESUMO MENSAL (INTERFACE DO PRINT) */}
      <div className="bg-[#1e293b] rounded-xl p-8 shadow-xl border border-slate-700/50">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Central do Contador</h1>
            <span className="bg-slate-700/50 border border-slate-600 text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
              Módulo 4
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Resumo operacional do mês para envio ao seu contador. Os dados são consolidados automaticamente a partir de suas vendas diárias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-wider mb-4">
              <TrendingUp className="w-4 h-4 text-amber-500" /> FATURAMENTO BRUTO
            </div>
            <div className="text-3xl font-black text-amber-400">
              {formatarMoeda(faturamentoBruto)}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-wider mb-4">
              <CreditCard className="w-4 h-4 text-pink-400" /> TAXAS DE CARTÃO (Est.)
            </div>
            <div className="text-3xl font-black text-pink-400">
              {formatarMoeda(taxasCartao)}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-wider mb-4">
              <Truck className="w-4 h-4 text-emerald-400" /> DESPESAS OPERACIONAIS
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {formatarMoeda(despesas)}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-amber-500 text-xs font-bold mb-3 uppercase tracking-wider">
            Mensagem pronta para o contador
          </h3>
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6 text-slate-300 text-sm leading-relaxed">
            {mensagemContador}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleCopiar}
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium py-3.5 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-5 h-5" /> Copiar mensagem
          </button>
          
          <button
            onClick={handleWhatsApp}
            className="flex-[2] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fad53] text-white font-bold py-3.5 rounded-lg transition-colors cursor-pointer shadow-lg shadow-green-900/20"
          >
            <Send className="w-5 h-5" /> Enviar por WhatsApp para o Contador
          </button>
        </div>
      </div>

      {/* BLOCO 2: TABELA DE HISTÓRICO RESTAURADA (MANUTENÇÃO DOS DADOS) */}
      <div className="bg-[#111c32] border border-slate-800 rounded-xl overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Histórico de Fechamentos Diários
          </h2>
          <button
            onClick={limparHistorico}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-800 font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-xs"
          >
            <Trash2 className="w-4 h-4" /> Limpar Histórico
          </button>
        </div>

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
                  <th className="p-3">Dinheiro</th>
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