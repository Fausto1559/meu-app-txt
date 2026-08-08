// src/screens/SalesCalculator.tsx
import { useState } from 'react';
import type { Plan } from '@/types';
import { Calculator, Check } from 'lucide-react';

interface SalesCalculatorProps {
  plan: Plan;
  onSaleBooked: (amount: number) => void;
}

export default function SalesCalculator({ plan, onSaleBooked }: SalesCalculatorProps) {
  const [amountInput, setAmountInput] = useState('');
  const [success, setSuccess] = useState(false);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const cleanValue = parseFloat(amountInput.replace(/\./g, '').replace(',', '.')) || 0;
    if (cleanValue > 0) {
      onSaleBooked(cleanValue);
      setAmountInput('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#C5A028]/20 border border-[#C5A028]/40 p-2.5 rounded-xl text-[#E5C158]">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Calculadora de Vendas</h2>
          <p className="text-xs text-slate-400">Registre entradas avulsas e some ao caixa diário.</p>
        </div>
      </div>

      {plan === 'gratis' ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300">
          O registro de vendas via calculadora está habilitado nos planos Copiloto e Alta Performance.
        </div>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Valor da Venda (R$)</label>
            <input
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#C5A028]/50"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C5A028]/20 hover:bg-[#C5A028]/30 border border-[#C5A028]/40 text-[#E5C158] font-medium text-sm py-2.5 px-4 rounded-xl transition-all"
          >
            Registrar Venda
          </button>

          {success && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">
              <Check className="w-4 h-4" /> Venda registrada com sucesso no caixa!
            </div>
          )}
        </form>
      )}
    </div>
  );
}