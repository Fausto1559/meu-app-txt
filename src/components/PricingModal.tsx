import React from 'react';
import { X, Check, Flame, Crown, Zap } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (plan: string, name: string, price: number) => void;
}

export default function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl w-full max-w-4xl p-6 relative text-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">SEJA COPILOTO PRO</h2>
          <p className="text-xs text-slate-400 mt-1">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser, sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Freemium / Essencial */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between relative">
            <div>
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-3">
                TRIAL 30 DIAS (GRÁTIS)
              </span>

              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Freemium / Essencial</h3>
              </div>

              {/* Bloco de Preços Corrigido */}
              <div className="my-4 flex flex-col gap-1">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-emerald-400">R$ 0,00</span>
                  <span className="text-xs text-slate-400 ml-1">/30 dias</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-amber-400">R$ 19,90</span>
                  <span className="text-xs text-slate-400 ml-1">/mês após 30 dias</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 mb-4">
                <p className="text-[11px] text-emerald-400 font-medium text-center">
                  Totalmente Gratuito no período de teste!
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Painel manual de prioridades</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Calculadora de balcão digital</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Fluxo de caixa básico</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Peça por e-mail</li>
              </ul>
            </div>

            <button 
              onClick={() => {
                if (onSelectPlan) onSelectPlan('essencial', 'Freemium / Essencial', 0);
                onClose();
              }}
              className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
            >
              Ativar Grátis (30 Dias)
            </button>
          </div>

          {/* Card 2: Copiloto */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Copiloto</h3>
              </div>

              <div className="my-4 flex items-baseline">
                <span className="text-2xl font-bold text-amber-400">R$ 29,90</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
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
              onClick={() => {
                if (onSelectPlan) onSelectPlan('copiloto', 'Copiloto', 29.90);
                onClose();
              }}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Assinar Copiloto
            </button>
          </div>

          {/* Card 3: Alta Performance */}
          <div className="bg-slate-900/60 border border-amber-500/40 rounded-xl p-5 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 text-[9px] font-bold text-slate-950 bg-amber-400 rounded-full uppercase tracking-wider">
              RECOMENDADO
            </span>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Alta Performance</h3>
              </div>

              <div className="my-4 flex items-baseline">
                <span className="text-2xl font-bold text-amber-400">R$ 39,90</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
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
              onClick={() => {
                if (onSelectPlan) onSelectPlan('alta_performance', 'Alta Performance', 39.90);
                onClose();
              }}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Assinar Alta Performance
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}