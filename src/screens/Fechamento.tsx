// src/screens/Fechamento.tsx
import type { Plan, ReceivableItem, PayableItem } from '@/types';
import { parseBRL } from '@/types';
import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FechamentoProps {
  plan: Plan;
  payables: PayableItem[];
  receivables: ReceivableItem[];
  vendasHoje: number;
}

export default function Fechamento({ plan, payables, receivables, vendasHoje }: FechamentoProps) {
  const totalReceivables = receivables
    .filter((r) => !r.received)
    .reduce((acc, r) => acc + parseBRL(r.amount), 0);

  const totalPayables = payables
    .filter((p) => !p.paid)
    .reduce((acc, p) => acc + parseBRL(p.amount), 0);

  const saldoFinal = totalReceivables + vendasHoje - totalPayables;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#C5A028]/20 border border-[#C5A028]/40 p-2.5 rounded-xl text-[#E5C158]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Fechamento de Caixa Diário</h2>
            <p className="text-xs text-slate-400">Resumo consolidado das operações e projeção financeira.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Entradas Totais (Vendas + Recebíveis)</span>
            <span className="text-xl font-bold text-emerald-400">
              R$ {(vendasHoje + totalReceivables).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Saídas Totais (Contas a Pagar)</span>
            <span className="text-xl font-bold text-red-400">
              R$ {totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Resultado Líquido Projetado</span>
            <span className={`text-xl font-bold ${saldoFinal >= 0 ? 'text-white' : 'text-red-400'}`}>
              R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl flex items-start gap-3">
          {saldoFinal >= 0 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs text-slate-300 leading-relaxed">
            {saldoFinal >= 0 ? (
              <p>O caixa encontra-se equilibrado. As entradas cobrem integralmente as obrigações pendentes para este período.</p>
            ) : (
              <p>Atenção: As obrigações a pagar superam as entradas projetadas. Recomenda-se avaliar o fluxo de recebimentos.</p>
            )}
            <p className="text-slate-500 mt-1">Plano atual ativo: <strong className="text-[#E5C158] uppercase">{plan}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}