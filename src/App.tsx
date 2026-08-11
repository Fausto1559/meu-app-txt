import { useState, useEffect } from 'react';
import { 
  Calculator, LayoutDashboard, FileText, Network, DollarSign, 
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Crown, 
  Flame, X, ShieldCheck, Download, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import LoginScreen from './screens/LoginScreen';
import CalculadoraExpress from './components/calculadora/CalculadoraExpress';
const calculateTimeLeft = () => {
  const targetDate = new Date('2026-09-09T23:59:59');
  const difference = +targetDate - +new Date();

  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'painel' | 'fechamento_diario' | 'fechamento_contador' | 'conexao'>('painel');
  const [isCalculadoraOpen, setIsCalculadoraOpen] = useState(false);
  
  const [userPlan, setUserPlan] = useState<'gratis' | 'essencial' | 'copiloto' | 'alta_performance'>('essencial');
  const [userPlanName, setUserPlanName] = useState('FREEMIUM / ESSENCIAL');
  const [userPlanPrice, setUserPlanPrice] = useState('R$ 19,90');
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const loadingTimer = setTimeout(() => { setLoading(false); }, 3000);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const [vendasHoje, setVendasHoje] = useState('R$ 19,90');
  const [aReceber, setAReceber] = useState('R$ 442,06');
  const [aPagar, setAPagar] = useState('R$ 4.080,00');
  const [saldoPrevisto, setSaldoPrevisto] = useState('R$ -3.637,94');

  const [contasReceber, setContasReceber] = useState([
    { id: 1, cliente: 'Cliente João Silva', vencimento: '2026-07-28', valor: 'R$ 262,06' },
    { id: 2, cliente: 'Pedido #1042', vencimento: '2026-08-05', valor: 'R$ 180,00' }
  ]);

  const [contasPagar, setContasPagar] = useState([
    { id: 1, fornecedor: 'Fornecedor ABC', vencimento: '2026-07-30', valor: 'R$ 1.200,00' },
    { id: 2, fornecedor: 'Aluguel Comercial', vencimento: '2026-08-10', valor: 'R$ 2.880,00' }
  ]);

  const [conexoes, setConexoes] = useState<Record<string, boolean>>({
    'Stone / Ton': false,
    'Redecard': false,
    'Getnet': false,
    'Cielo': false,
    'PagSeguro / PagBank': false
  });

  useEffect(() => {
    const loadingTimer = setTimeout(() => { setLoading(false); }, 3000);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#fff', background: '#050B14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const toggleConexao = (operadora: string) => {
    setConexoes(prev => ({
      ...prev,
      [operadora]: !prev[operadora]
    }));
  };

  const marcarRecebido = (id: number) => {
    setContasReceber(prev => prev.filter(item => item.id !== id));
    setAReceber('R$ 19,90');
  };

  const marcarPago = (id: number) => {
    setContasPagar(prev => prev.filter(item => item.id !== id));
    setAPagar('R$ 19,90');
  };

  const selecionarPlano = (tipo: 'gratis' | 'essencial' | 'copiloto' | 'alta_performance', nome: string, preco: string) => {
    setUserPlan(tipo);
    setUserPlanName(nome);
    setUserPlanPrice(preco);
    setIsUpgradeOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans relative">
      {/* Banner Apaga IncÃªndio - Risco de Caixa Negativo */}
      <div className="bg-red-600 animate-pulse px-6 py-2 flex items-center justify-between text-xs text-white border-b border-red-800">
        
        {/* 1. Esquerda: Título */}
        <div className="flex items-center gap-2 font-bold tracking-wider flex-1">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>MODO APAGA INCÊNDIO</span>
        </div>
        
        {/* 2. Meio: Contador Centralizado */}
        <div className="flex-1 flex justify-center items-center font-medium">
          Trial Gratuito: 
          <strong className="text-amber-400 font-mono ml-2 text-[13px]">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {String(timeLeft.seconds).padStart(2, '0')}s
          </strong>
        </div>

        {/* 3. Direita: Status do Caixa */}
        <div className="flex-1 flex justify-end items-center gap-2">
          <span className="font-semibold text-red-100">Status do caixa:</span>
          <span className="bg-red-950 text-red-400 px-2 py-0.5 rounded font-bold uppercase border border-red-400/50 shadow-sm">
            VERMELHO
          </span>
        </div>

      </div>

      <div className="px-6 py-2 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
        <span>Logado como: <strong className="text-white">{user?.email || user?.displayName}</strong></span>
        <button
          onClick={() => auth.signOut()}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 px-2 py-0.5 rounded"
        >
          Sair
        </button>
      </div>

      <header className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white tracking-wider">Copiloto Financeiro</h1>
              <p className="text-[10px] text-slate-400">Gestão inteligente para o seu negócio</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('painel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'painel' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Painel</span>
            </button>

            <button
              onClick={() => setIsCalculadoraOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Calculadora</span>
            </button>

            <button
              onClick={() => setActiveTab('fechamento_diario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fechamento_diario' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Fechamento Diário</span>
            </button>

            <button
              onClick={() => setActiveTab('fechamento_contador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fechamento_contador' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Central Contador</span>
            </button>

            <button
              onClick={() => setActiveTab('conexao')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'conexao' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Finance</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col-reverse md:flex-col md:flex-col md:flex-row items-center gap-4">
          <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">Plano Atual: <strong className="text-emerald-400">{userPlanName} ({userPlanPrice})</strong></span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsUpgradeOpen(!isUpgradeOpen)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center gap-1"
            >
              <span>Seja Copiloto Pro</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isUpgradeOpen && (
              <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400">SEJA COPILOTO PRO</h3>
                    <p className="text-xs text-slate-400">Escolha o plano ideal para o seu negócio. Cancele quando quiser, sem burocracia.</p>
                  </div>
                  <button onClick={() => setIsUpgradeOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
                  <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                    <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                      Trial 30 Dias (Grátis)
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Freemium / Essencial</h4>
                      <div className="text-lg font-bold text-emerald-400 font-mono">R$ 19,90<span className="text-[10px] text-slate-400 font-normal">/mês</span></div>
                      <p className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded">Totalmente Gratuito no período de teste!</p>
                      <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Painel manual de prioridades</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Calculadora de balcão digital</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fluxo de caixa básico</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Peça por e-mail</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => selecionarPlano('essencial', 'FREEMIUM / ESSENCIAL', 'R$ 19,90')} 
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Ativar Grátis (30 Dias)
                    </button>
                  </div>

                  <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Copiloto</h4>
                      <div className="text-lg font-bold text-amber-400 font-mono">R$ 29,90<span className="text-[10px] text-slate-400 font-normal">/mÃªs</span></div>
                      <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tudo do Essencial</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Finanças Abertas</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auditoria automática de taxas</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Comandos de voz</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cobrança via WhatsApp</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => selecionarPlano('copiloto', 'COPILOTO', 'R$ 29,90')} 
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Assinar Copiloto
                    </button>
                  </div>

                  <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                    <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                      Recomendado
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Copiloto Pro</h4>
                      <div className="text-lg font-bold text-amber-400 font-mono">R$ 39,90<span className="text-[10px] text-slate-400 font-normal">/mÃªs</span></div>
                      <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tudo do Copiloto</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fluxos automatizados do WhatsApp</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pix 1-Clique</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Central do Contador</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Relatórios avançados</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => selecionarPlano('alta_performance', 'Copiloto Pro', 'R$ 39,90')} 
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Assinar Copiloto Pro
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
        {activeTab === 'painel' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-amber-400">Suas prioridades de hoje</h2>
              <p className="text-xs text-slate-400">Selecionamos as ações mais urgentes para colocar dinheiro na caixa e evitar prejuízos. Resolva na ordem ” cada minuto conta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Vendas Hoje</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setVendasHoje('R$ 19,90')} className="text-slate-500 hover:text-amber-400 cursor-pointer" title="Zerar campo">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
                <div className="text-base font-bold text-white font-mono">{vendasHoje}</div>
                <div className="text-[10px] text-slate-400">Nenhuma maquininha</div>
              </div>

              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>A Receber</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setAReceber('R$ 19,90')} className="text-slate-500 hover:text-emerald-400 cursor-pointer" title="Zerar campo">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">{aReceber}</div>
                <div className="text-[10px] text-slate-400">Valores pendentes</div>
              </div>

              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>A Pagar</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setAPagar('R$ 19,90')} className="text-slate-500 hover:text-red-400 cursor-pointer" title="Zerar campo">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  </div>
                </div>
                <div className="text-base font-bold text-red-400 font-mono">{aPagar}</div>
                <div className="text-[10px] text-slate-400">Contas em aberto</div>
              </div>

              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Saldo Previsto</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSaldoPrevisto('R$ 19,90')} className="text-slate-500 hover:text-amber-400 cursor-pointer" title="Zerar campo">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
                <div className="text-base font-bold text-red-400 font-mono">{saldoPrevisto}</div>
                <div className="text-[10px] text-slate-400">Balanço geral</div>
              </div>
            </div>

            <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-slate-300">Conecte suas contas via Open Finance para automatizar o fluxo de vendas diárias.</p>
              </div>
              <button onClick={() => setActiveTab('conexao')} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer">
                Conectar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Contas a Receber Pendentes
                </h3>
                <div className="space-y-2.5">
                  {contasReceber.length > 0 ? (
                    contasReceber.map((item) => (
                      <div key={item.id} className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                        <div>
                          <p className="text-xs font-bold text-white">{item.cliente}</p>
                          <p className="text-[10px] text-slate-400">Vencimento: {item.vencimento}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-emerald-400">{item.valor}</span>
                          <button 
                            onClick={() => marcarRecebido(item.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Receber
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">Nenhuma conta pendente.</p>
                  )}
                </div>
              </div>

              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Contas a Pagar em Aberto
                </h3>
                <div className="space-y-2.5">
                  {contasPagar.length > 0 ? (
                    contasPagar.map((item) => (
                      <div key={item.id} className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                        <div>
                          <p className="text-xs font-bold text-white">{item.fornecedor}</p>
                          <p className="text-[10px] text-slate-400">Vencimento: {item.vencimento}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-red-400">{item.valor}</span>
                          <button 
                            onClick={() => marcarPago(item.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Pagar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">Nenhuma conta em aberto.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fechamento_diario' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Fechamento de Caixa Diário (Interno)</h2>
            <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
              <p className="text-xs text-slate-400">Resumo consolidado das operações diárias para controle interno da caixa.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
                <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                  <span className="text-xs text-slate-400">Entradas Totais</span>
                  <div className="text-base font-bold text-emerald-400 font-mono">R$ 442,06</div>
                </div>
                <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                  <span className="text-xs text-slate-400">Saídas Totais</span>
                  <div className="text-base font-bold text-red-400 font-mono">R$ 4.080,00</div>
                </div>
                <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl text-white max-h-[85vh] overflow-y-auto z-10">
                  <span className="text-xs text-slate-400">Resultado Líquido</span>
                  <div className="text-base font-bold text-red-400 font-mono">R$ -3.637,94</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fechamento_contador' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Central Contador / Fim de MÃªs</h2>
                <p className="text-xs text-slate-400">Relatório fiscal e gerencial completo formatado para o contador.</p>
              </div>
              <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Relatório</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Resumo Faturamento Mensal</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800"><span>Faturamento Bruto:</span> <strong className="font-mono text-white">R$ 14.580,00</strong></div>
                  <div className="flex justify-between py-1 border-b border-slate-800"><span>Total Descontos:</span> <strong className="font-mono text-white">R$ 19,90</strong></div>
                  <div className="flex justify-between py-1"><span>Líquido Apurado:</span> <strong className="font-mono text-emerald-400">R$ 14.580,00</strong></div>
                </div>
              </div>
              <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Obrigações e Guias</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800"><span>Contas Pagas no MÃªs:</span> <strong className="font-mono text-white">R$ 12.200,00</strong></div>
                  <div className="flex justify-between py-1 border-b border-slate-800"><span>Provisão Impostos (DAS):</span> <strong className="font-mono text-red-400">R$ 874,80</strong></div>
                  <div className="flex justify-between py-1"><span>Balanço Operacional:</span> <strong className="font-mono text-emerald-400">Positivo</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conexao' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Open Finance - Operadoras de Cartão de Crédito</h2>
              <p className="text-xs text-slate-400">Conecte suas operadoras para captura automática de vendas.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="space-y-3">
                {['Stone / Ton', 'Redecard', 'Getnet'].map((operadora, idx) => {
                  const conectado = conexoes[operadora];
                  return (
                    <div key={idx} className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                          {operadora.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{operadora}</p>
                          <p className="text-[10px] text-slate-400">
                            {conectado ? <span className="text-emerald-400 font-bold">Conectado via Open Finance</span> : 'Integração API Open Finance'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <button 
                          onClick={() => toggleConexao(operadora)} 
                          className="px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer bg-transparent border-0 hover:opacity-80 flex flex-col items-end leading-tight"
                        >
                          <span className="text-amber-400 font-bold">Conectar</span>
                          <span className="text-red-500 font-bold text-[10px]">Desconectar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {['Cielo', 'PagSeguro / PagBank'].map((operadora, idx) => {
                  const conectado = conexoes[operadora];
                  return (
                    <div key={idx} className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                          {operadora.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{operadora}</p>
                          <p className="text-[10px] text-slate-400">
                            {conectado ? <span className="text-emerald-400 font-bold">Conectado via Open Finance</span> : 'Integração API Open Finance'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <button 
                          onClick={() => toggleConexao(operadora)} 
                          className="px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer bg-transparent border-0 hover:opacity-80 flex flex-col items-end leading-tight"
                        >
                          <span className="text-amber-400 font-bold">Conectar</span>
                          <span className="text-red-500 font-bold text-[10px]">Desconectar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <CalculadoraExpress
        isOpen={isCalculadoraOpen}
        onClose={() => {
          setIsCalculadoraOpen(false);
          setActiveTab('painel');
        }}
        userPlan={userPlan}
      />
    </div>
  );
}



