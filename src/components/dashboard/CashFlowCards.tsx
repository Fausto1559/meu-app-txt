// src/components/dashboard/CashFlowCards.tsx
import { Wallet } from 'lucide-react';

interface Sale {
  valor_liquido: number;
  created_at: string | Date;
}

interface CashFlowCardsProps {
  sales: Sale[];
}

export default function CashFlowCards({ sales }: CashFlowCardsProps) {
  const aReceberPendente = sales.reduce((sum, s) => sum + s.valor_liquido, 0);
  const vendasHoje = sales
    .filter((s) => {
      const d = new Date(s.created_at);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, s) => sum + s.valor_liquido, 0);

  const totalRecebido = 1200;
  const despesas = 480;

  const chartHistory = [...sales.slice(0, 12).reverse().map((s) => s.valor_liquido), 0].slice(-12);
  if (chartHistory.length === 1 && chartHistory[0] === 0) {
    chartHistory.push(0, 0, 0, 0);
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-6 text-amber-400">
        <Wallet className="w-5 h-5" />
        <h2 className="text-lg font-bold text-white">Fluxo de Caixa</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">A HÁR PENDENTE</span>
          <p className="text-2xl font-bold text-amber-300 mt-2">
            R$ {aReceberPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VENDAS HOJE</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            R$ {vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TOTAL RECEBIDO</span>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DESPESAS</span>
          <p className="text-2xl font-bold text-red-400 mt-2">
            R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">EVOLUÇÃO (ÚLTIMAS VENDAS)</span>
        <div className="h-24 bg-slate-950/40 border border-slate-800/60 rounded-xl mt-2 flex items-end gap-1 p-2">
          {chartHistory.map((val, index) => (
            <div
              key={index}
              style={{ height: `${Math.max(val > 0 ? (val / 1500) * 100 : 10, 10)}%` }}
              className="flex-1 bg-amber-500/40 hover:bg-amber-400 rounded-t transition-all"
              title={`Valor: R$ ${val}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}