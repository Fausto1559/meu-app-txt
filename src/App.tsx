 import { useEffect, useState } from 'react';
import {
  Flame,
  Wallet,
  RefreshCw,
  Plus,
  CreditCard,
  Check,
  Crown,
  FileText,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  FirefightPayload,
  MaquininhaConnection,
  MaquininhaProvider,
} from '@/types';

type Plan = 'gratis' | 'copiloto' | 'alta-performance';
type Tab = 'painel' | 'calculadora' | 'fechamento' | 'conexao';

interface PayableItem {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  paid: boolean;
}

interface ReceivableItem {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  received: boolean;
}

export default function App() {
  const [plan, setPlan] = useState<Plan>('gratis');
  const [tab, setTab] = useState<Tab>('painel');

  // Conexões de maquininhas
  const [connectedMachines, setConnectedMachines] = useState<MaquininhaConnection[]>([]);

  // Lançamentos
  const [vendasHoje, setVendasHoje] = useState<number>(0);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([
    { id: '1', description: 'Cliente João Silva', amount: '262,06', dueDate: '2026-07-28', received: false },
    { id: '2', description: 'Pedido #1042', amount: '180,00', dueDate: '2026-08-02', received: false },
  ]);

  const [payables, setPayables] = useState<PayableItem[]>([
    { id: '1', description: 'Fornecedor ABC', amount: '1.200,00', dueDate: '2026-07-30', paid: false },
    { id: '2', description: 'Aluguel', amount: '2.500,00', dueDate: '2026-08-05', paid: false },
    { id: '3', description: 'Energia Elétrica', amount: '380,00', dueDate: '2026-08-10', paid: false },
  ]);

  // Formulários de inserção rápida
  const [newRecDesc, setNewRecDesc] = useState('');
  const [newRecAmount, setNewRecAmount] = useState('');
  const [newRecDate, setNewRecDate] = useState('');

  const [newPayDesc, setNewPayDesc] = useState('');
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayDate, setNewPayDate] = useState('');

  // Cálculos de Caixa
  const parseBRL = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const totalReceivables = receivables
    .filter((r) => !r.received)
    .reduce((acc, r) => acc + parseBRL(r.amount), 0);

  const totalPayables = payables
    .filter((p) => !p.paid)
    .reduce((acc, p) => acc + parseBRL(p.amount), 0);

  const caixaDisponivel = totalReceivables + vendasHoje;
  const saldoCaixa = caixaDisponivel - totalPayables;

  // Status visual do caixa
  const getCaixaStatus = () => {
    if (totalPayables === 0) return 'verde';
    if (caixaDisponivel >= totalPayables) return 'verde';
    if (caixaDisponivel >= totalPayables * 0.5) return 'amarelo';
    return 'vermelho';
  };

  const statusCaixa = getCaixaStatus();

  // Ações de Recebíveis
  const addReceivable = () => {
    if (!newRecDesc || !newRecAmount) return;
    setReceivables((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: newRecDesc,
        amount: newRecAmount,
        dueDate: newRecDate || new Date().toISOString().split('T')[0],
        received: false,
      },
    ]);
    setNewRecDesc('');
    setNewRecAmount('');
    setNewRecDate('');
  };

  const toggleReceivable = (id: string) => {
    setReceivables((prev) =>
      prev.map((r) => (r.id === id ? { ...r, received: !r.received } : r))
    );
  };

  // Ações de Pagáveis
  const addPayable = () => {
    if (!newPayDesc || !newPayAmount) return;
    setPayables((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: newPayDesc,
        amount: newPayAmount,
        dueDate: newPayDate || new Date().toISOString().split('T')[0],
        paid: false,
      },
    ]);
    setNewPayDesc('');
    setNewPayAmount('');
    setNewPayDate('');
  };

  const togglePayable = (id: string) => {
    setPayables((prev) =>
      prev.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p))
    );
  };

  // Conexão de Maquininhas
  const handleConnectMachine = (provider: MaquininhaProvider) => {
    const exists = connectedMachines.some((m) => m.provider === provider);
    if (!exists) {
      setConnectedMachines((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          provider,
          connectedAt: new Date().toISOString(),
          status: 'connected',
        },
      ]);
    }
  };

  const handleDisconnectMachine = (id: string) => {
    setConnectedMachines((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#060D1A] text-white flex flex-col font-sans">
      {/* Topo / Header */}
      <header className="border-b border-slate-800 bg-[#0B1528] px-4 py-3 flex items-center justify-between">
        <div className="flex items-[#00E5FF] items-center gap-2 font-bold text-lg">
          <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
          <span>COPILOTO FINANCEIRO</span>
        </div>

        {/* Status do Caixa Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              statusCaixa === 'verde'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : statusCaixa === 'amarelo'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusCaixa === 'verde'
                  ? 'bg-emerald-400 animate-pulse'
                  : statusCaixa === 'amarelo'
                  ? 'bg-amber-400'
                  : 'bg-rose-400 animate-bounce'
              }`}
            />
            {statusCaixa === 'verde' && 'Caixa Seguro'}
            {statusCaixa === 'amarelo' && 'Atenção ao Caixa'}
            {statusCaixa === 'vermelho' && 'Risco de Caixa!'}
          </div>

          {/* Seleção do Plano */}
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="gratis">Plano Grátis</option>
            <option value="copiloto">Copiloto AI</option>
            <option value="alta-performance">Alta Performance</option>
          </select>
        </div>
      </header>

      {/* Navegação Secundária */}
      <nav className="border-b border-slate-800 bg-[#081020] px-4 py-2 flex gap-2 text-sm">
        <button
          onClick={() => setTab('painel')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            tab === 'painel'
              ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Painel Principal
        </button>
        <button
          onClick={() => setTab('calculadora')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            tab === 'calculadora'
              ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Calculadora Express
        </button>
        <button
          onClick={() => setTab('fechamento')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            tab === 'fechamento'
              ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Fechamento
        </button>
        <button
          onClick={() => setTab('conexao')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            tab === 'conexao'
              ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Maquininhas
          {connectedMachines.length > 0 && (
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {connectedMachines.length}
            </span>
          )}
        </button>
      </nav>

      {/* Conteúdo das Abas */}
      <main className="flex-1 p-4 max-w-6xl w-full mx-auto overflow-y-auto">
        {tab === 'painel' && (
          <div className="space-y-6">
            {/* Cards Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0D1B32] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>A Receber + Vendas Hoje</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  R$ {caixaDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#0D1B32] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Contas a Pagar</span>
                  <Wallet className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400">
                  R$ {totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#0D1B32] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Saldo Projetado</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div
                  className={`text-2xl font-bold ${
                    saldoCaixa >= 0 ? 'text-blue-400' : 'text-rose-500'
                  }`}
                >
                  R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Listas de Lançamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contas a Receber */}
              <div className="bg-[#0D1B32] border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-emerald-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Entradas & Recebíveis
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={newRecDesc}
                    onChange={(e) => setNewRecDesc(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Valor (R$)"
                    value={newRecAmount}
                    onChange={(e) => setNewRecAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs"
                  />
                  <button
                    onClick={addReceivable}
                    className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded text-xs font-semibold"
                  >
                    OK
                  </button>
                </div>
                <div className="space-y-2">
                  {receivables.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => toggleReceivable(r.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        r.received
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-50 line-through'
                          : 'bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="text-slate-300">{r.description}</span>
                      <span className="font-semibold text-emerald-400">R$ {r.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contas a Pagar */}
              <div className="bg-[#0D1B32] border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-rose-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Saídas & Contas a Pagar
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={newPayDesc}
                    onChange={(e) => setNewPayDesc(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Valor (R$)"
                    value={newPayAmount}
                    onChange={(e) => setNewPayAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs"
                  />
                  <button
                    onClick={addPayable}
                    className="bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded text-xs font-semibold"
                  >
                    OK
                  </button>
                </div>
                <div className="space-y-2">
                  {payables.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => togglePayable(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        p.paid
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-50 line-through'
                          : 'bg-slate-900/80 border-slate-700/50 hover:border-rose-500/50'
                      }`}
                    >
                      <span className="text-slate-300">{p.description}</span>
                      <span className="font-semibold text-rose-400">R$ {p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'calculadora' && (
          <div className="bg-[#0D1B32] border border-slate-800 p-6 rounded-xl max-w-md mx-auto text-center space-y-4">
            <h2 className="text-lg font-bold text-blue-400 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" /> Calculadora Express
            </h2>
            <p className="text-xs text-slate-400">
              Insira o valor da venda para atualizar o caixa diário em tempo real.
            </p>
            <div className="flex gap-2 justify-center">
              <input
                type="number"
                placeholder="Valor R$"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-center w-36"
                onChange={(e) => setVendasHoje(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        {tab === 'fechamento' && (
          <div className="bg-[#0D1B32] border border-slate-800 p-6 rounded-xl text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Fechamento do Mês</h2>
            <p className="text-xs text-slate-400">Resumo simplificado para conciliação bancária.</p>
          </div>
        )}

        {tab === 'conexao' && (
          <div className="bg-[#0D1B32] border border-slate-800 p-6 rounded-xl space-y-4 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Conexão de Maquininhas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleConnectMachine('stone')}
                className="p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-300"
              >
                Conectar Stone
              </button>
              <button
                onClick={() => handleConnectMachine('pagseguro')}
                className="p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-300"
              >
                Conectar PagBank
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Marca d'água */}
      <footer className="text-center py-2 text-[10px] text-slate-600">
        Made in Bolt
      </footer>
    </div>
  );
}