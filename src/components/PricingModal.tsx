import React from 'react';
import { X, Check, Flame, Crown, ShieldCheck } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan?: any;
  onSelectPlan?: (plan: any) => void;
}

export default function PricingModal({ isOpen, onClose, userPlan, onSelectPlan }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0A1428] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#C5A028] via-[#E5C158] to-[#C5A028] bg-clip-text text-transparent uppercase tracking-wider">
              SEJA COPILOTO PRO
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha o plano ideal para o seu negócio. Cancele quando quiser, sem burocracia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid dos Planos */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Freemium / Essencial */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
            <div className="space-y-4">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full uppercase">
                Trial 30 Dias (Grátis)
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  Freemium / Essencial
                </h3>
                {/* Preços do Freemium */}
          <div className="flex flex-col gap-1 my-4">
            {/* Valor do Teste */}
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-emerald-400">R$ 0,00</span>
              <span className="text-slate-400 text-sm ml-1">/30 dias</span>
            </div>
            
            {/* Valor Dourado Após 30 Dias */}
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-amber-400">R$ 19,90</span>
              <span className="text-slate-400 text-sm ml-1">/após 30 dias</span>
            </div>
          </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Painel manual de prioridades</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Calculadora de balcão digital</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Fluxo de caixa básico</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Peça por e-mail</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan && onSelectPlan('essencial')}
              className="mt-6 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-all"
            >
              Ativar Grátis (30 Dias)
            </button>
          </div>

          {/* Card 2: Copiloto */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between relative hover:border-amber-500/50 transition-all shadow-lg shadow-amber-500/5">
            <div className="space-y-4">
              <span className="inline-block opacity-0 px-2.5 py-1 text-[10px]">Placeholder</span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Copiloto
                </h3>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-400">R$ 29,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Tudo do Essencial</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Finanças Abertas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Auditoria automática de taxas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Comandos de voz</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Cobrança via WhatsApp</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan && onSelectPlan('copiloto')}
              className="mt-6 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20"
            >
              Assinar Copiloto
            </button>
          </div>

          {/* Card 3: COPILOTO PRO */}
          <div className="bg-slate-900/90 border-2 border-amber-400 rounded-xl p-5 flex flex-col justify-between relative hover:border-amber-300 transition-all shadow-xl shadow-amber-500/10">
            <span className="absolute -top-3 right-4 px-3 py-0.5 bg-gradient-to-r from-[#C5A028] to-[#E5C158] text-slate-950 font-extrabold text-[9px] uppercase tracking-wider rounded-full shadow-md">
              Recomendado
            </span>
            <div className="space-y-4">
              <span className="inline-block opacity-0 px-2.5 py-1 text-[10px]">Placeholder</span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  COPILOTO PRO
                </h3>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-400">R$ 39,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Tudo do Copiloto</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Fluxos automatizados do WhatsApp</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Pix 1-Clique</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Central do Contador</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Relatórios avançados</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan && onSelectPlan('alta_performance')}
              className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-[#C5A028] to-[#E5C158] hover:opacity-90 text-slate-950 font-black text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 uppercase"
            >
              Assinar COPILOTO PRO
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}