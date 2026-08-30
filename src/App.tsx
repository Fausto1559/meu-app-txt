import { sendSignInLinkToEmail } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import LoginScreen from './screens/LoginScreen';
import { Privacidade } from './screens/Privacidade';

import { 
  Building2, FileSpreadsheet, Cpu, LogOut, Calculator, 
  LayoutDashboard, FileText, Network, DollarSign, ArrowUpRight, 
  ArrowDownRight, RefreshCw, AlertCircle, Crown, Flame, X, 
  ShieldCheck, Download, CheckCircle2, ChevronDown, Mic 
} from 'lucide-react';

import CalculadoraExpress from './components/calculadora/CalculadoraExpress';
import { FechamentoDiario } from './screens/FechamentoDiario';
import { CentralContador } from './screens/CentralContador';
import { OpenFinance } from './screens/OpenFinance';
import Painel from './screens/Painel';
import { Perfil } from './screens/Perfil';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(() => {
    return localStorage.getItem('aceitouPrivacidade') !== 'true';
  });

  const handleAcceptPrivacidade = () => {
    localStorage.setItem('aceitouPrivacidade', 'true');
    setMostrarPrivacidade(false);
  };

  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [activeTab, setActiveTab] = useState<'painel' | 'calculadora' | 'fechamento' | 'fechamento_contador' | 'open_finance' | 'OpenFinance' | 'perfil'>('painel');
  const [modoApagaIncendio, setModoApagaIncendio] = useState(false);
  const [diasTrial, setDiasTrial] = useState({ dias: 24, horas: 21, minutos: 43, segundos: 10 });
  const [isCalculadoraOpen, setIsCalculadoraOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [userPlan, setUserPlan] = useState('Freemium/Essencial');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLogin, setEmailLogin] = useState<string>('');
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [isPrivacidadeOpen, setIsPrivacidadeOpen] = useState(false);
  const userPlanName = userPlan === 'Freemium/Essencial' ? 'Copiloto' : 'Copiloto Pro';
  const userPlanPrice = userPlan === 'R$ 19,90/mês' ? 'R$ 29,90/mês' : 'R$ 39,90/mês';

// ESTADOS FINANCEIROS
  const [vendasHoje, setVendasHoje] = useState<number>(0);
  const [aReceber, setAReceber] = useState<number>(0);
  const [aPagar, setAPagar] = useState<number>(0);
  const [listeningField, setListeningField] = useState<string | null>(null);
  const saldoPrevisto = Number(vendasHoje) + Number(aReceber) - Number(aPagar);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // TEMPORIZADOR TRIAL
  const calculateTimeLeft = () => {
    let trialStart = localStorage.getItem('copiloto_trial_start');
    if (!trialStart) {
      trialStart = new Date().toISOString();
      localStorage.setItem('copiloto_trial_start', trialStart);
    }

    const targetDate = new Date(trialStart);
    targetDate.setDate(targetDate.getDate() + 30);
    const difference = +targetDate - +new Date();

    if (difference <= 0) {
      setIsTrialExpired(true);
      return '0d 0h 0m 0s';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const [timeLeft, setTimeLeft] = useState<string>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FUNÇÕES AUXILIARES
  const handleRecusarPrivacidade = () => {
  window.location.href = 'https://www.google.com';
};
  
  const handleVoiceInput = (fieldName: string, setter: (val: string) => void) => {
    setListeningField(fieldName);
    setTimeout(() => setListeningField(null), 3000);
  };

  // ESTADOS DO USUÁRIO E PLANOS (Ajustado para Freemium por padrão)
  const [selectedPlan, setSelectedPlan] = useState<string>('freemium');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('Freemium / Essencial');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<string>('Gratuito');

// Função de seleção atualizada para tratar o valor zero/gratuito
  const selecionarPlano = (id: string, name: string, price: string) => {
  setSelectedPlan(id);
  setSelectedPlanName(name);
  if (price === '0' || price === '0,00' || price.toLowerCase().includes('gratuit')) {
    setSelectedPlanPrice('Gratuito');
  } else {
    setSelectedPlanPrice(`R$ ${price}/mês`);
  }
  setIsUpgradeOpen(false);
};

// 1. Mapeamento de links dos 3 planos
const ASAAS_LINKS = {
  essencial: "https://sandbox.asaas.com/c/kvomyzpygxcgvmby",
  copiloto: "https://sandbox.asaas.com/c/SEU_LINK_COPILOTO",
  pro: "https://sandbox.asaas.com/c/SEU_LINK_COPILOTO_PRO"
};

// 2. Função de assinatura única
const handleSubscribe = (plano: 'essencial' | 'copiloto' | 'pro') => {
  const userUid = auth.currentUser?.uid;
  if (!userUid) {
    alert("Por favor, faça login antes de assinar.");
    return;
  }

  const baseUrl = ASAAS_LINKS[plano];
  const asaasLink = `${baseUrl}?externalReference=${userUid}`;
  window.open(asaasLink, "_blank");
};

const handleGoogleLogin = async () => {
    try {
      setIsAuthLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error: any) {
      console.error('Erro ao autenticar com Google:', error);
      alert('Erro ao autenticar com Google: ' + error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!emailLogin) return;
  try {
    setIsAuthLoading(true);
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, emailLogin, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', emailLogin);
    setEmailSent(true);
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    alert('Erro ao enviar e-mail: ' + error.message);
  } finally {
    setIsAuthLoading(false);
  }
};

const handleLogout = () => {
    // 1. Limpa as sessões locais de forma síncrona
    localStorage.removeItem('usuarioLogado');
    sessionStorage.clear();

    // 2. Apaga a tela do app no DOM imediatamente para esconder qualquer transição
    document.body.innerHTML = '<div style="background-color: #020617; height: 100vh; width: 100vw;"></div>';

    // 3. Desconecta do Firebase em segundo plano
    if (typeof auth !== 'undefined' && auth?.signOut) {
      auth.signOut().catch(() => {});
    }

    // 4. Redireciona direto para fora do sistema
    window.location.replace('https://www.google.com');
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

// TRAVA DE SEGURANÇA E TELA DE LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center text-white p-4">
        <div className="bg-[#1e293b] p-8 rounded-xl border border-slate-700 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Copiloto Financeiro</h2>
            <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          <div className="space-y-4">
            {/* 1. BOTÃO GOOGLE DOURADO FUNCIONAL */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 text-sm"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {isAuthLoading ? 'Aguarde...' : 'Fazer Login com o Google'}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">ou</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* 2. FORMULÁRIO DE EMAIL DOURADO FUNCIONAL */}
            {emailSent ? (
              <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-lg text-emerald-200 text-sm space-y-2">
                <p className="font-bold text-emerald-400">✅ Link enviado com sucesso!</p>
                <p>Enviamos um link de acesso para <strong className="text-white">{emailLogin}</strong>.</p>
                <p className="text-xs text-slate-300">Acesse sua caixa de e-mail e clique no link para entrar no aplicativo.</p>
                <button 
                  type="button"
                  onClick={() => setEmailSent(false)} 
                  className="text-xs text-amber-400 underline mt-2 cursor-pointer hover:text-amber-300"
                >
                  Tentar outro e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                  className="w-full bg-[#0c1527] border-2 border-amber-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 text-sm"
                >
                  {isAuthLoading ? 'Enviando...' : 'Receber Link de Acesso por E-mail'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

{mostrarPrivacidade && (
  <Privacidade onAccept={handleAcceptPrivacidade} />
)}

    return (
    <div className="min-h-screen bg-[#0c1527] text-white font-sans">
      
  {/* BARRA APAGA INCÊNDIO - CONTADOR CENTRALIZADO */}
<div className="relative w-full bg-gradient-to-r from-transparent via-red-900/90 to-transparent border-b border-red-600/40 py-2 px-6 grid grid-cols-1 md:grid-cols-3 items-center text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)] gap-2">
  
  {/* ESQUERDA: MODO APAGA INCÊNDIO */}
  <div className="flex items-center gap-2 font-bold text-red-100 tracking-wide justify-start">
    <span className="text-base animate-bounce">🔥</span>
    <span>MODO APAGA INCÊNDIO</span>
  </div>

  {/* CENTRO: CONTADOR TRIAL */}
  <div className="text-gray-200 text-center">
    Trial Gratuito: <span className="font-mono text-amber-400 font-bold">{timeLeft}</span>
  </div>

  {/* DIREITA: STATUS DO CAIXA */}
  <div className="flex items-center gap-2 justify-end">
    <span className="text-gray-300">Status do caixa:</span>
    <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wider">
      VERMELHO
    </span>
  </div>

</div>

      {/* 2. BARRA DE USUÁRIO */}
      <div className="px-6 py-2.5 flex items-center justify-between text-xs bg-[#14223c]/80 text-slate-300 border-b border-slate-700">
        <div>
          Logado como: <strong className="text-white">{user?.email || user?.displayName}</strong>
        </div>
        <button
          onClick={handleLogout}
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
            onClick={() => handleSubscribe('essencial')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-8 rounded-xl transition-colors"
          >
            Escolher Plano a partir de R$ 19,90/mês
          </button>
        </div>
      )}

      {/* 3. CONTEÚDO PRINCIPAL (FORMATADO PARA LAYOUT DE PC) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* CABEÇALHO E NAVEGAÇÃO */}
        <header className="w-full bg-[#14223c] border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'painel' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel</span>
          </button>

          <button
            onClick={() => setIsCalculadoraOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Calculadora</span>
          </button>

          <button
  onClick={() => setActiveTab('fechamento')}
  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
    activeTab === 'fechamento'
      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
  }`}
>
  <FileText className="w-4 h-4" />
  <span>Fechamento Diário</span>
</button>
          
          <button
            onClick={() => setActiveTab('fechamento_contador')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'fechamento_contador' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Central Contador</span>
          </button>

<button
  onClick={() => setActiveTab('OpenFinance')}
  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
    activeTab === 'OpenFinance' 
      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
  }`}
>
  <Cpu className="w-4 h-4 text-amber-400" />
  <span>Open Finance</span>
</button>

<button 
  onClick={() => setIsPerfilOpen(true)}
  className="text-slate-300 hover:text-white text-sm font-medium"
>
  Perfil
</button>

        </nav>
      </header>

      {/* BANNERS DE STATUS E BOTÃO DE UPGRADE */}
        <div className="w-full bg-[#14223c]/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
        {/* RENDERIZAÇÃO CONDICIONAL */}
        {activeTab === 'painel' && <Painel connectedMachines={[]} receivables={[]} />}
        {activeTab === 'fechamento' && <FechamentoDiario />}
        {activeTab === 'fechamento_contador' && <CentralContador />}
        {activeTab === 'OpenFinance' && <OpenFinance />}
      </main>

{isPerfilOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 text-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative border border-slate-800 shadow-2xl">
      <button 
        onClick={() => setIsPerfilOpen(false)}
        className="absolute top-4 right-4 text-gray-500 font-bold"
      >
        ✕
      </button>
      <Perfil />
    </div>
  </div>
)}

{isPrivacidadeOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 text-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative border border-slate-800 shadow-2xl">
      <button 
        onClick={handleRecusarPrivacidade}
        className="absolute top-4 right-4 text-gray-500 font-bold"
      >
        ✕
      </button>
</div>
  </div>
)}

      {/* MODAL DE PLANOS */}
      {isUpgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#14223c] border border-slate-700 rounded-2xl p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
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
                    ? 'border-emerald-500 bg-[#14223c]'
                    : 'border-slate-700 bg-[#14223c]/80 hover:border-slate-500'
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
                    ? 'border-amber-500 bg-[#14223c]'
                    : 'border-slate-700 bg-[#14223c]/80 hover:border-slate-500'
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
                    ? 'border-indigo-500 bg-[#14223c]'
                    : 'border-slate-700 bg-[#14223c]/80 hover:border-slate-500'
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