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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl w-full max-w-4xl p-6 relative text-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">SEJA COPILOTO PRO</h2>
          <p className="text-xs text-slate-400 mt-1">Escolha o plano ideal para o seu negócio. Cancele quando quiser, sem burocracia.</p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-1 md:grid-cols-3 md:grid-cols-1 md:grid-cols-3 md:grid-cols-1 md:grid-cols-3 md:grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Freemium / Essencial */}
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 pt-10 max-h-[88vh] overflow-y-auto my-auto shadow-2xl">
            <div>
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded-full mb-3">PLANO ESSENCIAL</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Flame className="w-4 h-4 text-emerald-400" /> Freemium / Essencial</h3>
              
              <div className="my-4 flex items-baseline">
                <span className="text-2xl font-bold text-emerald-400">R$ 0,00</span>
                <span className="text-xs text-slate-400 ml-1">/gratuito</span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 mb-3 text-[11px] text-emerald-300 text-center font-medium">
                Uso essencial gratuito para o seu negócio!
              </div>

              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Painel manual de prioridades</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Calculadora de balcão digital</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Fluxo de caixa básico</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Peça por e-mail</li>
              </ul>
            </div>
            <button onClick={() => { if(onSelectPlan) onSelectPlan('essencial', 'Freemium / Essencial', 0); onClose(); }} className="mt-6 w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg text-xs font-bold transition-all">Selecionar Essencial</button>
          </div>

          {/* Card 2: Copiloto */}
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 pt-10 max-h-[88vh] overflow-y-auto my-auto shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" /> Copiloto</h3>
              
              <div className="my-4 flex items-baseline">
                <span className="text-2xl font-bold text-amber-400">R$ 29,90</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Tudo do Essencial</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Finanças Abertas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Auditoria automática de taxas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Comandos de voz</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Cobrança via WhatsApp</li>
              </ul>
            </div>
            <button onClick={() => { if(onSelectPlan) onSelectPlan('copiloto', 'Copiloto', 29.90); onClose(); }} className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-lg text-xs font-bold transition-all shadow">Assinar Copiloto</button>
          </div>

          {/* Card 3: Copiloto Pro */}
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 pt-10 max-h-[88vh] overflow-y-auto my-auto shadow-2xl">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full uppercase">Recomendado</span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Copiloto Pro</h3>
              
              <div className="my-4 flex items-baseline">
                <span className="text-2xl font-bold text-amber-400">R$ 39,90</span>
                <span className="text-xs text-slate-400 ml-1">/mês</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Tudo do Copiloto</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Fluxos automatizados do WhatsApp</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Pix 1-Clique</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Central do Contador</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Relatórios avançados</li>
              </ul>
            </div>
            <button onClick={() => { if(onSelectPlan) onSelectPlan('alta_performance', 'Copiloto Pro', 39.90); onClose(); }} className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-lg text-xs font-bold transition-all shadow">Assinar Copiloto Pro</button>
          </div>

        </div>
      </div>
    </div>
  );
}

