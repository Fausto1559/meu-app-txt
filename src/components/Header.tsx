import { useState, useRef, useEffect } from 'react';
import type { Plan, CaixaStatus } from '@/types';
import { Crown, Flame, ShieldAlert, Clock, LayoutDashboard, Calculator, FileText, Link2 } from 'lucide-react';
import PricingModal from './PricingModal';
import CalculadoraExpress from './calculadora/CalculadoraExpress';

interface HeaderProps {
  plan: Plan;
  setPlan: (p: Plan) => void;
  caixaStatus: CaixaStatus;
  activeTab: 'painel' | 'calculadora' | 'fechamento' | 'conexao';
  setActiveTab: (tab: 'painel' | 'calculadora' | 'fechamento' | 'conexao') => void;
}

export default function Header({ plan, setPlan, caixaStatus, activeTab, setActiveTab }: HeaderProps) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [isCalculadoraOpen, setIsCalculadoraOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>(() => {
    const savedExpiry = localStorage.getItem('copiloto_trial_expiry');
    let expiryTime: number;
    if (savedExpiry) {
      expiryTime = Number(savedExpiry);
    } else {
      expiryTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('copiloto_trial_expiry', String(expiryTime));
    }

    const now = new Date().getTime();
    const distance = Math.max(0, expiryTime - now);

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const savedExpiry = localStorage.getItem('copiloto_trial_expiry');
      if (!savedExpiry) return;
      const distance = Math.max(0, Number(savedExpiry) - new Date().getTime());

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === '1';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planLabels: Record<Plan, string> = {
    degust: 'Degustação (App Completo)',
    gratis: 'Freemium/Essencial (R$ 19,90)',
    copiloto: 'Copiloto (R$ 29,90)',
    'alta-performance': 'Copiloto Pro (R$ 39,90)',
  };

  return (
    <>
      <header className="relative flex flex-col w-full select-none">
        <div className="relative w-full h-10 overflow-hidden bg-slate-950 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-600 via-red-500/80 to-transparent animate-pulse pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-600 via-red-500/80 to-transparent animate-pulse pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce"/>
            <span>MODO APAGA INCÊNDIO</span>
          </div>

          <div className="relative z-10 hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/40 px-3 py-1 rounded-lg text-amber-400 text-[11px] font-mono shadow-sm">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }}/>
            <span>Trial Gratuito:</span>
            <strong className="text-white">
              {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </strong>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Status da caixa:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              caixaStatus === 'verde' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              caixaStatus === 'amarelo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {caixaStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="bg-[#0A1428] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#C5A028]/20 border border-[#C5A028]/40 p-2 rounded-xl text-[#E5C158]">
              <Crown className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Copiloto Financeiro</h1>
              <p className="text-[11px] text-slate-400">Gestão inteligente para o seu negócio</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-lg">
            <button onClick={() => setActiveTab('painel')} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'painel' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>
            <button onClick={() => { setActiveTab('calculadora'); setIsCalculadoraOpen(true); }} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'calculadora' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <Calculator className="w-4 h-4" />
              <span>Calculadora</span>
            </button>
            <button onClick={() => setActiveTab('fechamento')} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'fechamento' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <FileText className="w-4 h-4" />
              <span>Fechamento</span>
            </button>
            <button onClick={() => setActiveTab('conexao')} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'conexao' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <Link2 className="w-4 h-4" />
              <span>Conexão</span>
            </button>
          </nav>

          <div className="flex flex-row-reverse sm:flex-row items-center gap-3">
            {isAdmin && (
              <div className="relative" ref={adminRef}>
                <button onClick={() => setAdminOpen(!adminOpen)} className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                  <ShieldAlert className="w-4 h-4"/>
                  <span>Admin Dev</span>
                </button>
                {adminOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-2 text-[10px] font-semibold text-red-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800">Painel do Desenvolvedor</div>
                    <button onClick={() => { setPlan('gratis'); setAdminOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/60 border-b border-slate-800/40 cursor-pointer">1. Freemium/Essencial = R$ 19,90</button>
                    <button onClick={() => { setPlan('copiloto'); setAdminOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/60 border-b border-slate-800/40 cursor-pointer">2. Copiloto = R$ 29,90</button>
                    <button onClick={() => { setPlan('alta-performance'); setAdminOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/60 cursor-pointer">3. Copiloto Pro = R$ 39,90</button>
                  </div>
                )}
              </div>
            )}

            {/* CONTAINER COM BOTÃO ACIMA DO STATUS */}
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={() => setPricingOpen(true)}
                className="bg-gradient-to-r from-[#C5A028] to-[#E5C158] hover:opacity-90 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#C5A028]/20 transition-all cursor-pointer"
              >
                <span>Seja Copiloto Pro</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Plano Atual: <strong className="uppercase">{planLabels[plan]}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <CalculadoraExpress
        isOpen={isCalculadoraOpen}
        onClose={() => setIsCalculadoraOpen(false)}
        userPlan={plan}
        isTrialActive={true}
        onOpenUpgrade={() => setPricingOpen(true)}
      />

      <PricingModal 
        isOpen={pricingOpen} 
        onClose={() => setPricingOpen(false)}
        onSelectPlan={(selectedPlan) => {
          setPlan(selectedPlan);
          setPricingOpen(false);
        }}
        currentPlan={plan}
      />
    </>
  );
}