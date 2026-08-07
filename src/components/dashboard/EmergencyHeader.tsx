// src/components/dashboard/EmergencyHeader.tsx
import { Flame } from 'lucide-react';

interface EmergencyHeaderProps {
  statusCaixa: string;
}

export default function EmergencyHeader({ statusCaixa }: EmergencyHeaderProps) {
  const isRed = statusCaixa === 'VERMELHO';

  return (
    <div className={`relative overflow-hidden ${isRed ? 'bg-red-600 animate-pulse' : 'bg-slate-900'} border-b border-slate-800`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 text-amber-300">
          <Flame className="h-5 w-5 animate-bounce" strokeWidth={2.4} />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            Modo Apaga Incêndio
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-300">
          <span className="text-xs font-medium text-slate-200">Status do caixa:</span>
          <span className="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300 backdrop-blur-sm ring-1 ring-amber-400/30">
            {statusCaixa}
          </span>
        </div>
      </div>
    </div>
  );
}