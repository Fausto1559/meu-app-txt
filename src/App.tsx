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
  FormaPagamento,
  Sale,
} from '@/types/firefight';
import { MAQUININHA_PROVIDERS } from '@/types/firefight';
import PriorityCard from '@/components/PriorityCard';
import BlockModal from '@/components/BlockModal';
import CashFlowPanel from '@/components/CashFlowPanel';
import MaquininhaModal from '@/components/MaquininhaModal';
import CalculatorModal from '@/components/CalculatorModal';
import PlansModal from '@/components/PlansModal';
import AccountantPanel from '@/components/AccountantPanel';
import PixModal from '@/components/PixModal';
import Confetti from '@/components/Confetti';

type View = 'dashboard' | 'fechamento';

const FALLBACK: FirefightPayload = {
  status_caixa_semana: 'VERMELHO',
  prioridades: [
    {
      id: 1,
      titulo: 'Pagar conta urgente de fornecedor ou imposto',
      descricao:
        'Você tem R$ 350 em conta. Quite a guia DAS-MEI de R$ 75 que vence hoje para evitar mais juros e negocie o boleto de farinha de R$ 480 para não bloquear seus insumos.',
      tipo_acao: 'pagar',
      telefone_contato: null,
      texto_whatsapp_ou_suporte: null,
    },
    {
      id: 2,
      titulo: 'Cobrar valor pendente da Padaria do Zé',
      descricao:
        'A Padaria do Zé deve R$ 650 há 7 dias. Mande uma mensagem para colocar esse dinheiro no caixa hoje mesmo.',
      tipo_acao: 'cobrar',
      telefone_contato: '5511999998888',
      texto_whatsapp_ou_suporte:
        'Olá Zé, tudo bem? Notei que o pagamento de R$ 650,00 venceu há 7 dias. Consegue fazer o PIX para a gente hoje? Obrigado!',
    },
    {
      id: 3,
      titulo: 'Cobrança indevida de taxa na maquininha',
      descricao:
        'A Maquinha Top cobrou 4,8% de taxa em R$ 1.200,00 de vendas, mas sua taxa combinada é de 2,1%. Exija a devolução do dinheiro cobrado a mais.',
      tipo_acao: 'alerta_taxa',
      telefone_contato: '5511900001111',
      texto_whatsapp_ou_suporte:
        'Olá, suporte da Maquinha Top. Identifiquei que foi cobrada a taxa de 4,8% nas minhas vendas, mas minha taxa contratada é 2,1%. Solicito o estorno da diferença.',
    },
  ],
};

const BASE_DESPESAS = 480;
const BASE_RECEBIDO = 1200;

function App() {
  const [data, setData] = useState<FirefightPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connections, setConnections] = useState<MaquininhaConnection[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [maquininhaOpen, setMaquininhaOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [confettiFire, setConfettiFire] = useState(0);
  const [view, setView] = useState<View>('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: dbError } = await supabase
        .from('firefight_priorities')
        .select('payload')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;
      setData(rows?.payload ?? FALLBACK);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados.');
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    const { data: rows, error } = await supabase
      .from('maquininha_connections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return;
    setConnections((rows as MaquininhaConnection[]) ?? []);
  };

  const loadSales = async () => {
    const { data: rows, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return;
    setSales((rows as Sale[]) ?? []);
  };

  useEffect(() => {
    loadData();
    loadConnections();
    loadSales();
  }, []);

  const handleConnect = async (provider: MaquininhaProvider) => {
    await new Promise((r) => setTimeout(r, 2000));
    const { error } = await supabase
      .from('maquininha_connections')
      .insert({
        provider,
        status: 'conectado',
        connected_at: new Date().toISOString(),
      });
    if (error) throw error;
    await loadConnections();
    showToast(`${provider} conectado com sucesso!`);
  };

  const handleDisconnect = async (provider: MaquininhaProvider) => {
    const conn = connections.find((c) => c.provider === provider);
    if (!conn) return;
    const { error } = await supabase
      .from('maquininha_connections')
      .update({ status: 'desconectado', connected_at: null })
      .eq('id', conn.id);
    if (error) throw error;
    await loadConnections();
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        prioridades: prev.prioridades.filter((p) => p.tipo_acao !== 'alerta_taxa'),
      };
    });
    showToast(`${provider} desconectado. Sincronização automática encerrada.`);
  };

  const handleSaveSale = async (
    precoVenda: number,
    custoProduto: number,
    forma: FormaPagamento,
    valorLiquido: number,
    taxa: number,
  ) => {
    const { error } = await supabase.from('sales').insert({
      preco_venda: precoVenda,
      custo_produto: custoProduto,
      forma_pagamento: forma,
      valor_liquido: valorLiquido,
      taxa_aplicada: taxa,
    });
    if (error) throw error;
    await loadSales();
    showToast('Venda salva e fluxo de caixa atualizado!');
  };

  const handleSelectPlan = (planId: string, planName: string, planPrice: string) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setPlansOpen(false);
    setPixOpen(true);
  };

  const handlePixConfirm = () => {
    setPixOpen(false);
    setActivePlan(selectedPlan?.name ?? null);
    setConfettiFire((f) => f + 1);
    showToast(`Pagamento confirmado! Plano ${selectedPlan?.name ?? ''} ativo!`);
  };

  const canUseAdvanced = activePlan === 'Copiloto' || activePlan === 'Alta Performance';

  const handleUpgradeFromBlock = () => {
    setBlockOpen(false);
    setSelectedPlan({ name: 'Copiloto', price: 'R$ 29,90' });
    setPixOpen(true);
  };

  const isRed = data?.status_caixa_semana === 'VERMELHO';

  const aReceberPendente = sales.reduce((sum, s) => sum + s.valor_liquido, 0);
  const vendasHoje = sales
    .filter((s) => {
      const d = new Date(s.created_at);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, s) => sum + s.valor_liquido, 0);
  const totalRecebido = BASE_RECEBIDO;
  const despesas = BASE_DESPESAS;

  const chartHistory = [...sales.slice(0, 12).reverse().map((s) => s.valor_liquido), 0].slice(-12);
  if (chartHistory.length === 1 && chartHistory[0] === 0) {
    chartHistory.push(0, 0, 0, 0);
  }

  const connectedCount = connections.filter((c) => c.status === 'conectado').length;
  const connectedProviders = connections.filter((c) => c.status === 'conectado');
  const hasOpenFinance = connectedCount > 0;

  const visiblePrioridades =
    data?.prioridades.filter((p) => {
      if (p.tipo_acao === 'alerta_taxa') return hasOpenFinance;
      return true;
    }) ?? [];

  return (
    <div className="min-h-screen bg-blue-950 pb-24">
      {/* Flashing red status bar */}
      <div
        className={`relative overflow-hidden ${
          isRed ? 'bg-red-600 animate-pulse-status' : 'bg-blue-900'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 text-amber-300">
            <Flame className="h-5 w-5" strokeWidth={2.4} />
            <span className="text-sm font-bold uppercase tracking-wider">
              Modo Apaga Incêndio
            </span>
          </div>
          <div className="flex items-center gap-2 text-amber-300">
            <span className="text-xs font-medium opacity-80">Status do caixa:</span>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300 backdrop-blur-sm ring-1 ring-amber-400/30">
              {data?.status_caixa_semana ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="sticky top-0 z-30 border-b border-blue-800/60 bg-blue-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${view === 'dashboard' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' : 'text-amber-400/60 hover:text-amber-300'}`}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">Painel</span>
            </button>
            <button
              onClick={() => setView('fechamento')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${view === 'fechamento' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' : 'text-amber-400/60 hover:text-amber-300'}`}
            >
              <FileText className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">Fechamento do Mês</span>
            </button>
          </div>
          {activePlan && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              {activePlan === 'Alta Performance' ? 'Plano Performance' : `Plano ${activePlan}`}
            </span>
          )}
          <button
            onClick={() => setPlansOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-sm font-bold text-blue-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-300 active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" strokeWidth={2.4} />
            Planos Escolha o Seu
          </button>
        </div>
      </nav>

      {view === 'dashboard' ? (
        <>
          {/* Header */}
          <header className="mx-auto max-w-6xl px-6 pt-10 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <Wallet className="h-4 w-4" strokeWidth={2.2} />
                  Copiloto Financeiro MEI / MPE
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-amber-300 sm:text-4xl">
                  Suas prioridades de hoje
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-100/70">
                  Selecionamos as ações mais urgentes para colocar dinheiro no caixa
                  e evitar prejuízo. Resolva na ordem — cada minuto conta.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMaquininhaOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-blue-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98]"
                >
                  <CreditCard className="h-4 w-4" strokeWidth={2.4} />
                  Conectar Maquininha
                  {connectedCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      {connectedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 shadow-sm transition-all hover:border-amber-400/60 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.2} />
                  Atualizar
                </button>
              </div>
            </div>
          </header>

          {/* Open Finance connection status */}
          <div className="mx-auto max-w-6xl px-6 pt-2 pb-4">
            {hasOpenFinance ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2.2} />
                <span className="text-sm font-semibold text-emerald-300">
                  {connectedCount} {connectedCount === 1 ? 'maquininha conectada' : 'maquininhas conectadas'} via Open Finance:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedProviders.map((c) => {
                    const info = MAQUININHA_PROVIDERS.find((p) => p.id === c.provider);
                    return (
                      <span
                        key={c.id}
                        className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {info?.name ?? c.provider}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-blue-800/60 bg-blue-950/50 px-4 py-3">
                <Unplug className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2.2} />
                <span className="text-sm font-medium text-slate-400">
                  Nenhuma maquininha conectada via Open Finance.
                </span>
                <button
                  onClick={() => setMaquininhaOpen(true)}
                  className="ml-auto text-xs font-bold text-amber-400 transition-colors hover:text-amber-300"
                >
                  Conectar agora →
                </button>
              </div>
            )}
          </div>

          {/* Cash flow panel */}
          <main className="mx-auto max-w-6xl px-6">
            <CashFlowPanel
              aReceberPendente={aReceberPendente}
              vendasHoje={vendasHoje}
              totalRecebido={totalRecebido}
              despesas={despesas}
              history={chartHistory}
            />
          </main>

          {/* Priority cards */}
          <section className="mx-auto max-w-6xl px-6 pt-8 pb-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-300">
              <Flame className="h-5 w-5" strokeWidth={2.2} />
              Prioridades do Apaga Incêndio
            </h2>
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-200">
                Mostrando dados de exemplo — não foi possível conectar ao banco.
              </div>
            )}
            {loading && !data ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-64 animate-pulse rounded-2xl border border-blue-800/60 bg-blue-900/40"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePrioridades.map((item) => (
                  <PriorityCard
                    key={item.id}
                    item={item}
                    canUseAdvanced={canUseAdvanced}
                    onBlocked={() => setBlockOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <main className="mx-auto max-w-6xl px-6 pt-10 pb-6">
          <header className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
              <FileText className="h-4 w-4" strokeWidth={2.2} />
              Módulo 4 · Central do Contador
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-300 sm:text-4xl">
              Fechamento do Mês
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-100/70">
              Resumo operacional consolidado para envio ao seu contador.
            </p>
          </header>
          <AccountantPanel />
        </main>
      )}

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-center text-xs text-amber-400/50">
        Copiloto Financeiro MEI / MPE · Modo Apaga Incêndio
      </footer>

      {/* Floating action button */}
      <button
        onClick={() => setCalcOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-blue-950 shadow-2xl shadow-amber-500/30 transition-all hover:scale-110 hover:bg-amber-400 active:scale-95"
        title="Calculadora de Balcão Express"
      >
        <Plus className="h-7 w-7" strokeWidth={2.6} />
      </button>

      {/* Modals */}
      <MaquininhaModal
        open={maquininhaOpen}
        onClose={() => setMaquininhaOpen(false)}
        connections={connections}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <CalculatorModal
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        onSave={handleSaveSale}
        canUseVoice={canUseAdvanced}
        onVoiceBlocked={() => setBlockOpen(true)}
      />
      <PlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        onSelectPlan={handleSelectPlan}
      />
      <BlockModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        onUpgrade={handleUpgradeFromBlock}
      />
      {selectedPlan && (
        <PixModal
          open={pixOpen}
          onClose={() => setPixOpen(false)}
          onConfirm={handlePixConfirm}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
        />
      )}
      <Confetti fire={confettiFire} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-xl backdrop-blur-sm animate-modal-in">
          <Check className="h-4 w-4" strokeWidth={2.6} />
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
