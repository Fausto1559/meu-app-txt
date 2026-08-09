import { X, Check, Crown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-4xl bg-[#0A1428] rounded-2xl p-6 border border-slate-700 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white">Fechar</button>

        {/* TÍTULO EM DOURADO */}
        <h2 className="text-2xl font-black text-[#C5A028] text-center mb-8">SEJA COPILOTO PRO</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ESSENCIAL */}
          <div className="border border-slate-700 p-4 rounded-xl">
            <h3 className="text-white font-bold">Freemium / Essencial</h3>
            <p className="text-emerald-400 font-bold text-xl">R$ 0,00</p>
            <p className="text-amber-400 text-xs mt-1">Após 30 dias: R$ 19,90/mês</p>
          </div>

          {/* COPILOTO */}
          <div className="border border-slate-700 p-4 rounded-xl">
            <h3 className="text-white font-bold">Copiloto</h3>
            <p className="text-amber-400 font-bold text-xl">R$ 29,90/mês</p>
          </div>

          {/* COPILOTO PRO */}
          <div className="border-[#C5A028] border-2 p-4 rounded-xl bg-[#C5A028]/5">
            <h3 className="text-white font-bold">Copiloto Pro</h3>
            <p className="text-[#E5C158] font-bold text-xl">R$ 39,90/mês</p>
            <button onClick={() => onSelectPlan('alta-performance')} className="bg-[#C5A028] w-full mt-4 py-2 rounded font-bold text-black">Assinar</button>
          </div>
        </div>
      </div>
    </div>
  );
}