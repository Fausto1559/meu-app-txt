import { X, Check, Crown, Flame } from 'lucide-react';
import type { Plan } from '@/types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
  currentPlan: Plan;
}

export default function PricingModal({ isOpen, onClose, onSelectPlan, currentPlan }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0A1428] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/80 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TÍTULO EM DOURADO: "Seja Copiloto Pro" */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-black tracking-wide text-[#C5A028] mb-2 flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-[#C5A028]" />
            Seja Copiloto Pro
          </h2>
          <p className="text-sm text-slate-400">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser, sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plano 1: Freemium / Essencial com R$ 19,90 após os 30 dias */}
          <div className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
            currentPlan === 'gratis' || currentPlan === 'degust'
              ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
                <Flame className="w-3.5 h-3.5" />
                TRIAL 30 DIAS (GRÁTIS)
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Freemium / Essencial</h3>
              <div className="mb-4">
                <span className="text-2xl font-black text-emerald-400">R$ 0,00</span>
                <span className="text-xs text-slate-400"> / 30 dias</span>
                <p className="text-xs text-amber-400/90 font-medium mt-1">Após os 30 dias: R$ 19,90/mês</p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Painel manual de prioridades</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Calculadora de balcão digital</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Fluxo de caixa básico</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Peça por e-mail</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('gratis')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer border border-slate-700"
            >
              Ativar Grátis (30 Dias)
            </button>
          </div>

          {/* Plano 2: Copiloto */}
          <div className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
            currentPlan === 'copiloto'
              ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
                <Crown className="w-3.5 h-3.5" />
                POPULAR
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Copiloto</h3>
              <div className="mb-4">
                <span className="text-2xl font-black text-amber-400">R$ 29,90</span>
                <span className="text-xs text-slate-400"> /mês</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0"/> Tudo do Essencial</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0"/> Finanças Abertas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0"/> Auditoria automática de taxas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0"/> Comandos de voz</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0"/> Cobrança via WhatsApp</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('copiloto')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A028] to-[#E5C158] hover:opacity-90 text-slate-950 font-bold text-xs transition-all shadow-md shadow-[#C5A028]/20 cursor-pointer"
            >
              Assinar Copiloto
            </button>
          </div>

          {/* Plano 3: Copiloto Pro (Substituiu Alta Performance) */}
          <div className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
            currentPlan === 'alta-performance'
              ? 'bg-slate-900/90 border-[#C5A028] shadow-lg shadow-[#C5A028]/20'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#C5A028] text-slate-950 font-black text-[10px] tracking-wider uppercase">
              Recomendado
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A028]/10 border border-[#C5A028]/30 text-[#E5C158] text-xs font-bold mb-4">
                <Crown className="w-3.5 h-3.5" />
                MÁXIMA PERFORMANCE
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Copiloto Pro</h3>
              <div className="mb-4">
                <span className="text-2xl font-black text-[#E5C158]">R$ 39,90</span>
                <span className="text-xs text-slate-400"> /mês</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#E5C158] shrink-0"/> Tudo do Copiloto</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#E5C158] shrink-0"/> Fluxos automatizados do WhatsApp</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#E5C158] shrink-0"/> Pix 1-Clique</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#E5C158] shrink-0"/> Central do Contador</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#E5C158] shrink-0"/> Relatórios avançados</li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan('alta-performance')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A028] to-[#E5C158] hover:opacity-90 text-slate-950 font-bold text-xs transition-all shadow-md shadow-[#C5A028]/20 cursor-pointer"
            >
              Assinar Copiloto Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}