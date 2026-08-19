import React, { useState, useEffect } from 'react';
import {
  Calculator, LayoutDashboard, FileText, Network, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Crown,
  Flame, X, ShieldCheck, Download, CheckCircle2, ChevronDown, Mic
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import CalculadoraExpress from './components/calculadora/CalculadoraExpress';
export default function App() {
  // ESTADOS DE AUTENTICAÇÃO
  const [emailLogin, setEmailLogin] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  // VERIFICAÇÃO DO LINK DE EMAIL
  useEffect(() => {
    if (typeof auth !== 'undefined' && auth && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Por favor, confirme seu e-mail para finalizar o login:');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
          })
          .catch((error) => console.error('Erro ao autenticar via link:', error));
      }
    }
  }, []);

  // FUNÇÕES DE LOGIN
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error: any) {
      console.error('Erro ao autenticar com Google:', error);
      alert('Erro ao autenticar com Google: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin) return;
    try {
      setAuthLoading(true);
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
      setAuthLoading(false);
    }
  };

  // 1. ESTADOS DE NAVEGAÇÃO E MODAIS
  const [activeTab, setActiveTab] = useState<string>('painel');
  const [isCalculadoraOpen, setIsCalculadoraOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);

  // 2. ESTADOS DO USUÁRIO E PLANOS
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 3. ESTADOS FINANCEIROS
  const [vendasHoje, setVendasHoje] = useState<string>('R$ 0,00');
  const [aReceber, setAReceber] = useState<string>('R$ 0,00');
  const [aPagar, setAPagar] = useState<string>('R$ 0,00');
  const [saldoPrevisto, setSaldoPrevisto] = useState<string>('R$ 0,00');
  const [listeningField, setListeningField] = useState<string | null>(null);

  // 4. TEMPORIZADOR TRIAL
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

  // 5. FUNÇÕES AUXILIARES
  const handleVoiceInput = (fieldName: string, setter: (val: string) => void) => {
    setListeningField(fieldName);
    setTimeout(() => setListeningField(null), 3000);
  };

  // 2. ESTADOS DO USUÁRIO E PLANOS (Ajustado para Freemium por padrão)
  const [userPlan, setUserPlan] = useState<string>('freemium');
  const [userPlanName, setUserPlanName] = useState<string>('Freemium / Essencial');
  const [userPlanPrice, setUserPlanPrice] = useState<string>('Gratuito');

// Função de seleção atualizada para tratar o valor zero/gratuito
  const selecionarPlano = (id: string, name: string, price: string) => {
  setUserPlan(id);
  setUserPlanName(name);
  if (price === '0' || price === '0,00' || price.toLowerCase().includes('gratuit')) {
    setUserPlanPrice('Gratuito');
  } else {
    setUserPlanPrice(`R$ ${price}/mês`);
  }
  setIsUpgradeOpen(false);
};

const handleLogout = async () => {
  try {
    // 1. Limpa o estado local imediatamente
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();

    // 2. Desconecta do Firebase se a instância existir
    if (typeof auth !== 'undefined' && auth?.signOut) {
      await auth.signOut();
    }
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error);
  } finally {
    // 3. Força o redirecionamento limpo para a raiz
    window.location.href = '/';
  }
};

// TRAVA DE SEGURANÇA E TELA DE LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c1527] flex items-center justify-center text-white p-4">
        <div className="bg-[#14223c] p-8 rounded-xl border border-slate-700 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Copiloto Financeiro</h2>
            <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          <div className="space-y-4">
            {/* 1. BOTÃO GOOGLE DOURADO FUNCIONAL */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 text-sm"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {authLoading ? 'Aguarde...' : 'Fazer Login com o Google'}
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
                  disabled={authLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 text-sm"
                >
                  {authLoading ? 'Enviando...' : 'Receber Link de Acesso por E-mail'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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
      <div className="px-6 py-2.5 flex items-center justify-between text-xs bg-[#14223c]/80 text-slate-300 border-b border-slate-800">
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
        <header className="w-full bg-[#14223c] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
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
        <div className="w-full bg-[#14223c]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              <div className="flex flex-col justify-between rounded-xl p-5 bg-[#14223c] border border-slate-800 hover:border-slate-700 transition-all">
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
              <div className="flex flex-col justify-between rounded-xl p-5 bg-[#14223c] border border-slate-800 hover:border-slate-700 transition-all">
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
              <div className="flex flex-col justify-between rounded-xl p-5 bg-[#14223c] border border-slate-800 hover:border-slate-700 transition-all">
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
              <div className="flex flex-col justify-between rounded-xl p-5 bg-[#14223c] border border-slate-800 hover:border-slate-700 transition-all">
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
