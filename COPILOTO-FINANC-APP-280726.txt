import { useState, useMemo } from 'react';
import type { Plan, Tab, ConnectedMachine, PayableItem, ReceivableItem, CaixaStatus } from '@/types';
import { parseBRL } from '@/types';
import Header from '@/components/Header';
import TopNav from '@/components/TopNav';
import Painel from '@/screens/Painel';
import Fechamento from '@/screens/Fechamento';
import Conexao from '@/screens/Conexao';
import SalesCalculator from '@/screens/SalesCalculator';

export default function App() {
  const [plan, setPlan] = useState<Plan>('gratis');
  const [tab, setTab] = useState<Tab>('painel');
  const [connectedMachines, setConnectedMachines] = useState<ConnectedMachine[]>([]);
  const [vendasHoje, setVendasHoje] = useState(0);

  const [receivables, setReceivables] = useState<ReceivableItem[]>([
    { id: '1', description: 'Cliente João Silva', amount: '262,06', dueDate: '2026-07-28', received: false },
    { id: '2', description: 'Pedido #1042',       amount: '180,00', dueDate: '2026-08-02', received: false },
  ]);

  const [payables, setPayables] = useState<PayableItem[]>([
    { id: '1', description: 'Fornecedor ABC',   amount: '1.200,00', dueDate: '2026-07-30', paid: false },
    { id: '2', description: 'Aluguel',          amount: '2.500,00', dueDate: '2026-08-05', paid: false },
    { id: '3', description: 'Energia Elétrica', amount: '380,00',   dueDate: '2026-08-10', paid: false },
  ]);

  const caixaStatus = useMemo<CaixaStatus>(() => {
    const totalRec = receivables.filter(r => !r.received).reduce((s, r) => s + parseBRL(r.amount), 0);
    const totalPag = payables.filter(p => !p.paid).reduce((s, p) => s + parseBRL(p.amount), 0);
    const have = totalRec + vendasHoje;
    if (totalPag === 0) return 'verde';
    if (have >= totalPag) return 'verde';
    if (have >= totalPag * 0.5) return 'amarelo';
    return 'vermelho';
  }, [receivables, payables, vendasHoje]);

  function handleConnect(m: ConnectedMachine) {
    setConnectedMachines(prev => [...prev, m]);
  }

  function handleDisconnect(id: string) {
    setConnectedMachines(prev => prev.filter(m => m.id !== id));
  }

  function handleDisconnectAll() {
    setConnectedMachines([]);
  }

  function handleSaleBooked(amount: number) {
    if (plan === 'copiloto' || plan === 'alta-performance') {
      setVendasHoje(prev => prev + amount);
    }
  }

  return (
    <div className="min-h-screen bg-[#060D1A] text-white flex flex-col">
      <Header plan={plan} setPlan={setPlan} caixaStatus={caixaStatus} />
      <TopNav tab={tab} setTab={setTab} />

      <main className="flex-1 overflow-y-auto">
        {tab === 'painel' && (
          <Painel
            plan={plan}
            connectedMachines={connectedMachines}
            receivables={receivables}
            setReceivables={setReceivables}
            payables={payables}
            setPayables={setPayables}
            vendasHoje={vendasHoje}
            setVendasHoje={setVendasHoje}
            onSaleBooked={handleSaleBooked}
            onNavigateToConexao={() => setTab('conexao')}
          />
        )}
        {tab === 'calculadora' && (
          <div className="max-w-lg mx-auto px-3 pt-3 pb-4">
            <SalesCalculator plan={plan} onSaleBooked={handleSaleBooked} />
          </div>
        )}
        {tab === 'fechamento' && (
          <Fechamento
            plan={plan}
            payables={payables}
            receivables={receivables}
            vendasHoje={vendasHoje}
          />
        )}
        {tab === 'conexao' && (
          <Conexao
            plan={plan}
            connectedMachines={connectedMachines}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onDisconnectAll={handleDisconnectAll}
          />
        )}
      </main>

      {/* Made in Bolt */}
      <div className="fixed bottom-2 right-3 text-[#1E3054] text-[10px] font-medium select-none pointer-events-none z-50">
        Made in Bolt
      </div>
    </div>
  );
}
