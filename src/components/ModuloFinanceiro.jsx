import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";

export default function ModuloFinanceiro({ userEmail }) {
  const [periodo, setPeriodo] = useState('dia'); // 'dia', 'semana', 'mes'
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [tipo, setTipo] = useState('receber'); // 'venda', 'receber', 'pagar'
  const [subcategoria, setSubcategoria] = useState('fiado_cliente');
  const [entidadeNome, setEntidadeNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState('PIX');

  // Buscar dados no Supabase
  const carregarTransacoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .order('data_vencimento', { ascending: true });

    if (!error && data) {
      setTransacoes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  // Salvar novo lançamento
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valor || !entidadeNome) return alert('Preencha os campos obrigatórios!');

    const novoLancamento = {
      user_email: userEmail || 'usuario@copiloto.com',
      tipo: tipo === 'venda' ? 'venda' : tipo,
      subcategoria: tipo === 'venda' ? 'venda_direta' : subcategoria,
      entidade_nome: entidadeNome,
      descricao,
      valor: parseFloat(valor),
      data_vencimento: dataVencimento,
      forma_pagamento: formaPagamento,
      status: tipo === 'venda' ? 'recebido' : 'a_vencer'
    };

    const { error } = await supabase.from('transacoes_financeiras').insert([novoLancamento]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Lançamento registrado com sucesso!');
      setEntidadeNome('');
      setDescricao('');
      setValor('');
      carregarTransacoes();
    }
  };

  // Funções de filtro por período
  const hoje = new Date().toISOString().split('T')[0];

  const filtrarPorPeriodo = (item) => {
    const itemData = new Date(item.data_vencimento || item.data_emissao);
    const hojeData = new Date();

    if (periodo === 'dia') {
      return item.data_vencimento === hoje;
    } else if (periodo === 'semana') {
      const diffDias = (itemData - hojeData) / (1000 * 60 * 60 * 24);
      return diffDias >= -1 && diffDias <= 7;
    } else if (periodo === 'mes') {
      return itemData.getMonth() === hojeData.getMonth() && itemData.getFullYear() === hojeData.getFullYear();
    }
  };

  const dadosFiltrados = transacoes.filter(filtrarPorPeriodo);

  const vendasFiltradas = dadosFiltrados.filter(t => t.tipo === 'venda');
  const receberFiltradas = dadosFiltrados.filter(t => t.tipo === 'receber' || t.subcategoria === 'fiado_cliente');
  const pagarFiltradas = dadosFiltrados.filter(t => t.tipo === 'pagar');

  // Cálculos dos Totais
  const totalVendas = vendasFiltradas.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalFiados = receberFiltradas.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalPagar = pagarFiltradas.reduce((acc, t) => acc + Number(t.valor), 0);

  const rotuloPeriodo = periodo === 'dia' ? 'hoje' : periodo === 'semana' ? 'esta semana' : 'este mês';

  const gruposRelatorio = [
    { titulo: 'Vendas', items: vendasFiltradas, cor: 'text-emerald-400' },
    { titulo: 'Contas a Receber', items: receberFiltradas, cor: 'text-cyan-400' },
    { titulo: 'Contas a Pagar', items: pagarFiltradas, cor: 'text-rose-400' },
  ];

  return (
    <div data-testid="modulo-financeiro" className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-900 text-slate-100 min-h-screen">
      
      {/* CABEÇALHO E FILTRO DE PERÍODO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Relatórios</h1>
          <p className="text-slate-400 text-sm">Vendas {rotuloPeriodo}, contas a receber e contas a pagar</p>
        </div>

        {/* SELETOR DE PERÍODO (DIA, SEMANA, MÊS) */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          {['dia', 'semana', 'mes'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                periodo === p ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'dia' ? 'Hoje (Dia)' : p === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 border border-slate-600 text-slate-200 hover:text-white"
        >
          Imprimir
        </button>
      </div>

      {/* CARDS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-emerald-500 border-slate-700">
          <p className="text-slate-400 text-xs font-semibold uppercase">Vendas {rotuloPeriodo}</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">R$ {totalVendas.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-cyan-500 border-slate-700">
          <p className="text-slate-400 text-xs font-semibold uppercase">A receber {rotuloPeriodo}</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1">R$ {totalFiados.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-rose-500 border-slate-700">
          <p className="text-slate-400 text-xs font-semibold uppercase">A pagar {rotuloPeriodo}</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">R$ {totalPagar.toFixed(2)}</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-lg font-bold text-amber-400 mb-4">Novo Lançamento Financeiro</h2>
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div>
            <label htmlFor="tipo-operacao" className="block text-xs text-slate-400 mb-1">Tipo de Operação</label>
            <select
              id="tipo-operacao"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                if (e.target.value === 'receber') setSubcategoria('fiado_cliente');
                if (e.target.value === 'pagar') setSubcategoria('fornecedor_prazo');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="venda">Venda Direta (À Vista)</option>
              <option value="receber">A Receber / Fiado (Cliente)</option>
              <option value="pagar">A Pagar (Despesa / Fornecedor)</option>
            </select>
          </div>

          {tipo === 'pagar' && (
            <div>
              <label htmlFor="categoria-despesa" className="block text-xs text-slate-400 mb-1">Categoria da Despesa</label>
              <select
                id="categoria-despesa"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="fornecedor_prazo">Fornecedor a Prazo</option>
                <option value="despesa_fixa">Despesa Fixa (Aluguel, Luz, Contador)</option>
                <option value="despesa_variavel">Despesa Variável (Manutenção, Combustível)</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="entidade-nome" className="block text-xs text-slate-400 mb-1">
              {tipo === 'pagar' ? 'Nome do Fornecedor / Credor' : 'Nome do Cliente'} *
            </label>
            <input
              id="entidade-nome"
              type="text"
              placeholder="Ex: João da Silva / Terrazze Toldos"
              value={entidadeNome}
              onChange={(e) => setEntidadeNome(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="valor-lancamento" className="block text-xs text-slate-400 mb-1">Valor (R$) *</label>
            <input
              id="valor-lancamento"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="data-vencimento" className="block text-xs text-slate-400 mb-1">Data de Vencimento</label>
            <input
              id="data-vencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label htmlFor="descricao-lancamento" className="block text-xs text-slate-400 mb-1">Descrição / Histórico</label>
            <input
              id="descricao-lancamento"
              type="text"
              placeholder="Ex: Compra de Lonas ou Toldo Retrátil"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="md:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>

      {dadosFiltrados.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center text-slate-500">
          Nenhum registro encontrado para este período.
        </div>
      ) : (
        <div className="space-y-6">
          {renderTabela(`Vendas (${rotuloPeriodo})`, vendasDoPeriodo, 'text-emerald-400')}
          {renderTabela(`Contas a receber (${rotuloPeriodo})`, receberDoPeriodo, 'text-cyan-400')}
          {renderTabela(`Contas a pagar (${rotuloPeriodo})`, pagarDoPeriodo, 'text-rose-400')}
        </div>
      )}

    </div>
  );
}