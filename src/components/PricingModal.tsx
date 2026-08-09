Set-Content -Path "src\components\PricingModal.tsx" -Value 'import { X, Zap, Crown, Sparkles, Check } from ''lucide-react'';
import type { Plan } from ''@/types'';

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
      <div className="relative w-full max-w-4xl bg-[#0B132B] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/80 border border-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5"/>
        </button>

        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-wide mb-2">
            Seja Copiloto Pro
          </h2>
          <p className="text-xs text-slate-400">
            Tenha controle total e ferramentas avançadas de gestão. Cancele quando quiser, sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          <div className={`relative bg-slate-900/90 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            currentPlan === ''gratis'' ? ''border-[#C5A028] shadow-lg shadow-[#C5A028]/10'' : ''border-slate-800 hover:border-slate-700''
          }`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Zap className="w-5 h-5"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Freemium / Essencial</h3>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-emerald-400">R$ 0,00</span>
                  <span className="text-[11px] text-slate-400">/ 30 dias</span>
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Depois R$ 19,90<span className="text-[10px]">/mês</span>
                </div>
              </div>
              
              <ul className="flex flex-col gap-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Painel manual de prioridades</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Calculadora de balcão digital</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Fluxo de caixa básico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Peça por e-mail</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => { onSelectPlan(''gratis''); onClose(); }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPlan === ''gratis''
                  ? ''bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20''
                  : ''bg-slate-800 hover:bg-slate-700 text-white border border-slate-700''
              }`}
            >
              {currentPlan === ''gratis'' ? ''Plano Atual'' : ''Ativar Grátis (30 Dias)''}
            </button>
          </div>

          <div className={`relative bg-slate-900/90 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            currentPlan === ''copiloto'' ? ''border-[#C5A028] shadow-lg shadow-[#C5A028]/10'' : ''border-amber-500/40 hover:border-amber-500/60''
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Mais Popular
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Sparkles className="w-5 h-5"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Copiloto</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-extrabold text-amber-400">R$ 29,90</span>
                <span className="text-[11px] text-slate-400">/mês</span>
              </div>
              
              <ul className="flex flex-col gap-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Tudo do Essencial</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Finanças Abertas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Auditoria automática de taxas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Comandos de voz</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Cobrança via WhatsApp</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => { onSelectPlan(''copiloto''); onClose(); }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPlan === ''copiloto''
                  ? ''bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20''
                  : ''bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-90 text-slate-950''
              }`}
            >
              {currentPlan === ''copiloto'' ? ''Plano Atual'' : ''Assinar Copiloto''}
            </button>
          </div>

          <div className={`relative bg-slate-900/90 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            currentPlan === ''alta-performance'' ? ''border-[#C5A028] shadow-lg shadow-[#C5A028]/10'' : ''border-slate-800 hover:border-slate-700''
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Recomendado
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Crown className="w-5 h-5"/>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Copiloto Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-extrabold text-amber-400">R$ 39,90</span>
                <span className="text-[11px] text-slate-400">/mês</span>
              </div>
              
              <ul className="flex flex-col gap-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Tudo do Copiloto</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Fluxos automatizados do WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Pix 1-Clique</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Central do Contador</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
                  <span>Relatórios avançados</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => { onSelectPlan(''alta-performance''); onClose(); }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPlan === ''alta-performance''
                  ? ''bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20''
                  : ''bg-slate-800 hover:bg-slate-700 text-white border border-slate-700''
              }`}
            >
              {currentPlan === ''alta-performance'' ? ''Plano Atual'' : ''Assinar Copiloto Pro''}
            </button>
          </div>

        </div>

        <div className="text-center text-[11px] text-slate-500">
          Pagamento via Pix ou cartão • Cancele a qualquer momento
        </div>

      </div>
    </div>
  );
}'
