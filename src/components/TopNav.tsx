// src/components/TopNav.tsx
import type { Tab } from '@/types';
import { LayoutDashboard, Calculator, FileText, Cpu } from 'lucide-react';

interface TopNavProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

export default function TopNav({ tab, setTab }: TopNavProps) {
  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard },
    { id: 'calculadora', label: 'Calculadora', icon: Calculator },
    { id: 'fechamento', label: 'Fechamento', icon: FileText },
    { id: 'conexao', label: 'Conexão', icon: Cpu },
  ];

  return (
    <nav className="bg-slate-900/40 border-b border-slate-800/60 px-6 py-2 flex gap-2 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? 'bg-[#C5A028]/20 border border-[#C5A028]/30 text-[#E5C158]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}