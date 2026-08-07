// src/components/dashboard/DashboardNav.tsx
import { LayoutGrid, FileText, Crown } from 'lucide-react';

interface DashboardNavProps {
  activeTab: 'painel' | 'fechamento';
  onChangeTab: (tab: 'painel' | 'fechamento') => void;
  onOpenPlans: () => void;
}

export default function DashboardNav({ activeTab, onChangeTab, onOpenPlans }: DashboardNavProps) {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <button
        onClick={() => onChangeTab('painel')}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          activeTab === 'painel'
            ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
        <span>Painel</span>
      </button>
      <button
        onClick={() => onChangeTab('fechamento')}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          activeTab === 'fechamento'
            ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
        }`}
      >
        <FileText className="h-4 w-4" strokeWidth={2.2} />
        <span>Fechamento do Mês</span>
      </button>
      <button
        onClick={onOpenPlans}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-300 ml-auto md:ml-0"
      >
        <Crown className="h-4 w-4" strokeWidth={2.4} />
        <span>Planos</span>
      </button>
    </div>
  );
}