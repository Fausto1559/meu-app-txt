import { useState, useEffect } from 'react';
import {
  Calculator, LayoutDashboard, FileText, Network, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Crown,
  Flame, X, ShieldCheck, Download, CheckCircle2, ChevronDown, Mic
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import LoginScreen from './screens/LoginScreen';
import CalculadoraExpress from './components/calculadora/CalculadoraExpress';
// Função de cálculo do tempo restante do trial
  const calculateTimeLeft = () => {
    // Define a data final do trial (exemplo: 27 dias a partir do registro)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 27);
    targetDate.setHours(23, 59, 59);

    const difference = +targetDate - +new Date();
    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return '0d 0h 0m 0s';
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Atualiza o contador a cada 1 segundo sem travar
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'painel' | 'fechamento_diario' | 'fechamento_contador' | 'conexao'>('painel');
  const [isCalculadoraOpen, setIsCalculadoraOpen] = useState(false);
  
  const [userPlan, setUserPlan] = useState<'gratis' | 'essencial' | 'copiloto' | 'alta_performance'>('essencial');
  const [userPlanName, setUserPlanName] = useState('FREEMIUM / ESSENCIAL');
  const [userPlanPrice, setUserPlanPrice] = useState('R$ 19,90');
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const [listeningField, setListeningField] = useState<string | null>(null);

  const handleVoiceInput = (fieldKey: string, callback: (valor: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setListeningField(fieldKey);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript.trim();
      transcript = transcript.replace(/reais|real/gi, '').trim();

      // Formatação para garantir separador de milhar (.) e centavos (,00)
      if (!transcript.includes(',')) {
        let cleanNum = transcript.replace(/\./g, '').trim();
        if (!isNaN(Number(cleanNum)) && cleanNum !== '') {
          let num = parseInt(cleanNum, 10);
          transcript = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      } else {
        let parts = transcript.split(',');
        let integerPart = parts[0].replace(/\./g, '');
        let decimalPart = parts[1].trim();
        if (decimalPart.length === 1) decimalPart += '0';
        if (!isNaN(Number(integerPart))) {
          let num = parseInt(integerPart, 10);
          transcript = `${num.toLocaleString('pt-BR')},${decimalPart}`;
        }
      }

      if (!transcript.toUpperCase().startsWith('R$')) {
        transcript = `R$ ${transcript}`;
      }
      callback(transcript);
    };

    recognition.start();
  };

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

  const isTrialExpired = false; // Altere para true para testar o bloqueio de tela
  
  const selecionarPlano = (tipo: 'gratis' | 'essencial' | 'copiloto' | 'alta_performance', nome: string, preco: string) => {
    setUserPlan(tipo);
    setUserPlanName(nome);
    setUserPlanPrice(preco);
    setIsUpgradeOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans relative antialiased">
      
      {/* 1. BARRA SUPERIOR - 3 COLUNAS */}
      <div className="bg-red-900/90 text-white px-6 py-2 grid grid-cols-1 md:grid-cols-3 items-center text-xs gap-2 border-b border-red-800">
        <div className="flex items-center gap-2 font-bold tracking-wide justify-start">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>MODO APAGA INCÊNDIO</span>
        </div>

        <div className="text-center font-medium">
          <span>Trial Gratuito: </span>
          <strong className="text-amber-400 font-mono">{timeLeft}</strong>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span>Status do caixa:</span>
          <span className="bg-red-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px] tracking-wider">VERMELHO</span>
        </div>
      </div>

      {/* 2. BARRA DE USUÁRIO */}
      <div className="px-6 py-2.5 flex items-center justify-between text-xs bg-slate-900/80 text-slate-300 border-b border-slate-800">
        <div>
          Logado como: <strong className="text-white">{user?.email || user?.displayName}</strong>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 px-3 py-1 rounded text-xs transition-all cursor-pointer"
        >
          Sair
        </button>
      </div>

      {/* BLOQUEIO DE TELA QUANDO O TRIAL DE 30 DIAS EXPIRAR */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full">
            <Flame className="w-12 h-12 text-red-500 animate-bounce" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-bold text-white">Seu período de testes de 30 dias expirou</h2>
            <p className="text-sm text-slate-400">
              Para continuar gerando relatórios, acessando o fluxo de caixa e utilizando o Copiloto Financeiro, escolha o seu plano.
            </p>
          </div>
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Escolher Plano a partir de R$ 19,90/mês
          </button>
        </div>
      )}

      {/* 3. CONTEÚDO PRINCIPAL (FORMATADO PARA LAYOUT DE PC) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* CABEÇALHO E NAVEGAÇÃO */}
        <header className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Copiloto Financeiro</h1>
              <p className="text-xs text-slate-400">Gestão inteligente para o seu negócio</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => setActiveTab('painel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'painel' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>

            <button
              onClick={() => setIsCalculadoraOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Calculadora</span>
            </button>

            <button
              onClick={() => setActiveTab('fechamento_diario')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fechamento_diario' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Fechamento Diário</span>
            </button>

            <button
              onClick={() => setActiveTab('fechamento_contador')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fechamento_contador' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Central Contador</span>
            </button>

            <button
              onClick={() => setActiveTab('conexao')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'conexao' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Network className="w-4 h-4 text-amber-400" />
              <span>Open Finance</span>
            </button>
          </nav>
        </header>

        {/* BANNERS DE STATUS E BOTÃO DE UPGRADE */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Plano Atual: <strong className="text-emerald-400 font-bold">{userPlanName} ({userPlanPrice})</strong></span>
          </div>

          <button
            onClick={() => setIsUpgradeOpen(!isUpgradeOpen)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center gap-2"
          >
            <span>Seja Copiloto Pro</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ABA PAINEL */}
        {activeTab === 'painel' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-400">Suas prioridades de hoje</h2>
              <p className="text-xs text-slate-400">
                Selecionamos as ações mais urgentes para colocar dinheiro na caixa e evitar prejuízos. Resolva na ordem — cada minuto conta.
              </p>
            </div>

            {/* CARDS FORMATADOS EM GRID EXPANSÍVEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* CARD VENDAS HOJE */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center text-slate-400 text-xs mb-3">
                  <span>Vendas Hoje</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('vendasHoje', (valor) => setVendasHoje(valor))}
                      className={`p-1 rounded-md transition-colors ${
                        listeningField === 'vendasHoje'
                          ? 'bg-red-500/20 text-red-400 animate-pulse'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Digitar por voz"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVendasHoje('R$ 0,00')}
                      className="text-slate-500 hover:text-white p-1"
                      title="Zerar valor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={vendasHoje}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.toUpperCase().startsWith('R$')) val = `R$ ${val}`;
                    setVendasHoje(val);
                  }}
                  className="bg-transparent text-base font-bold text-white font-mono outline-none border-b border-slate-800 focus:border-amber-400 w-full pb-1"
                />
                <div className="text-[10px] text-slate-400 mt-2">Nenhuma maquininha</div>
              </div>

              {/* CARD A RECEBER */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center text-slate-400 text-xs mb-3">
                  <span>A Receber</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('aReceber', (valor) => setAReceber(valor))}
                      className={`p-1 rounded-md transition-colors ${
                        listeningField === 'aReceber'
                          ? 'bg-red-500/20 text-red-400 animate-pulse'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Digitar por voz"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAReceber('R$ 0,00')}
                      className="text-slate-500 hover:text-emerald-400 p-1"
                      title="Zerar valor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={aReceber}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.toUpperCase().startsWith('R$')) val = `R$ ${val}`;
                    setAReceber(val);
                  }}
                  className="bg-transparent text-base font-bold text-emerald-400 font-mono outline-none border-b border-slate-800 focus:border-emerald-400 w-full pb-1"
                />
                <div className="text-[10px] text-slate-400 mt-2">Valores pendentes</div>
              </div>

              {/* CARD A PAGAR */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center text-slate-400 text-xs mb-3">
                  <span>A Pagar</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('aPagar', (valor) => setAPagar(valor))}
                      className={`p-1 rounded-md transition-colors ${
                        listeningField === 'aPagar'
                          ? 'bg-red-500/20 text-red-400 animate-pulse'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Digitar por voz"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAPagar('R$ 0,00')}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Zerar valor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={aPagar}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.toUpperCase().startsWith('R$')) val = `R$ ${val}`;
                    setAPagar(val);
                  }}
                  className="bg-transparent text-base font-bold text-red-400 font-mono outline-none border-b border-slate-800 focus:border-red-400 w-full pb-1"
                />
                <div className="text-[10px] text-slate-400 mt-2">Contas em aberto</div>
              </div>

              {/* CARD SALDO PREVISTO */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center text-slate-400 text-xs mb-3">
                  <span>Saldo Previsto</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('saldoPrevisto', (valor) => setSaldoPrevisto(valor))}
                      className={`p-1 rounded-md transition-colors ${
                        listeningField === 'saldoPrevisto'
                          ? 'bg-red-500/20 text-red-400 animate-pulse'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Digitar por voz"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaldoPrevisto('R$ 0,00')}
                      className="text-slate-500 hover:text-amber-400 p-1"
                      title="Zerar valor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={saldoPrevisto}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.toUpperCase().startsWith('R$')) val = `R$ ${val}`;
                    setSaldoPrevisto(val);
                  }}
                  className="bg-transparent text-base font-bold text-red-400 font-mono outline-none border-b border-slate-800 focus:border-amber-400 w-full pb-1"
                />
                <div className="text-[10px] text-slate-400 mt-2">Balanço geral</div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* MODAL DE PLANOS */}
      {isUpgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
            <button
              onClick={() => setIsUpgradeOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-amber-400">SEJA COPILOTO PRO</h2>
              <p className="text-sm text-slate-300 mt-1">Escolha o plano ideal para o seu negócio. Cancele quando quiser.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                onClick={() => selecionarPlano('essencial', 'Essencial', '19,90')}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  userPlan === 'essencial'
                    ? 'border-emerald-500 bg-slate-800'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500'
                }`}
              >
                <h3 className="font-bold text-base text-white">Freemium (30 Dias) / Essencial</h3>
                <p className="text-2xl font-extrabold text-emerald-400 mt-2">R$ 19,90<span className="text-xs font-normal text-slate-300">/mês</span></p>
                <ul className="mt-4 text-xs text-slate-200 space-y-2">
                  <li>✓ Painel manual de prioridades</li>
                  <li>✓ Calculadora de balcão digital</li>
                  <li>✓ Fluxo de caixa básico</li>
                </ul>
                <button className="w-full mt-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer">
                  {userPlan === 'essencial' ? 'Plano Atual' : 'Ativar Essencial'}
                </button>
              </div>

              <div
                onClick={() => selecionarPlano('copiloto', 'Copiloto', '29,90')}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  userPlan === 'copiloto'
                    ? 'border-amber-500 bg-slate-800'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500'
                }`}
              >
                <h3 className="font-bold text-lg text-white">Copiloto</h3>
                <p className="text-2xl font-extrabold text-amber-400 mt-2">R$ 29,90<span className="text-xs font-normal text-slate-300">/mês</span></p>
                <ul className="mt-4 text-xs text-slate-200 space-y-2">
                  <li>✓ Tudo do Essencial</li>
                  <li>✓ Finanças Abertas</li>
                  <li>✓ Auditoria automática de taxas</li>
                  <li>✓ Comandos de voz</li>
                  <li>✓ Cobrança via WhatsApp</li>
                </ul>
                <button className="w-full mt-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer">
                  {userPlan === 'copiloto' ? 'Plano Atual' : 'Assinar Copiloto'}
                </button>
              </div>

              <div
                onClick={() => selecionarPlano('alta_performance', 'Copiloto Pro', '39,90')}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  userPlan === 'alta_performance'
                    ? 'border-indigo-500 bg-slate-800'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500'
                }`}
              >
                <h3 className="font-bold text-lg text-white">Copiloto Pro</h3>
                <p className="text-2xl font-extrabold text-indigo-400 mt-2">R$ 39,90<span className="text-xs font-normal text-slate-300">/mês</span></p>
                <ul className="mt-4 text-xs text-slate-200 space-y-2">
                  <li>✓ Tudo do Copiloto</li>
                  <li>✓ Relatórios executivos automatizados</li>
                  <li>✓ Suporte prioritário dedicado</li>
                  <li>✓ Central do Contador</li>
                </ul>
                <button className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer">
                  {userPlan === 'alta_performance' ? 'Plano Atual' : 'Assinar Copiloto Pro'}
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsUpgradeOpen(false)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE DA CALCULADORA PRESERVADO */}
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
