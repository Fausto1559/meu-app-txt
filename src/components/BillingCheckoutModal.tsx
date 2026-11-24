import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

type PlanKey = 'essencial' | 'profissional' | 'pro';

interface BillingCheckoutModalProps {
  planKey: PlanKey | null;
  onClose: () => void;
  onCompleted: () => void;
}

const PLAN_LABELS: Record<PlanKey, string> = {
  essencial: 'Essencial Básico — R$ 19,90/mês',
  profissional: 'Copiloto Intermediário — R$ 29,90/mês',
  pro: 'Copiloto PRO — R$ 39,90/mês',
};

export const BillingCheckoutModal: React.FC<BillingCheckoutModalProps> = ({
  planKey,
  onClose,
  onCompleted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO'>('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    subscriptionId: string;
    nextDueDate: string;
    monthlyValue: number;
  } | null>(null);

  if (!planKey) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planKey, customerName, cpfCnpj, billingType }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Não foi possível criar a assinatura.');
      }

      setResult({
        subscriptionId: payload.subscriptionId,
        nextDueDate: payload.nextDueDate,
        monthlyValue: payload.monthlyValue,
      });
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada no checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#2e4372] bg-[#111a2e] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300">Contratação segura · Asaas</span>
            <h2 className="text-xl font-extrabold text-white mt-1">{result ? 'Assinatura criada' : 'Contratar plano'}</h2>
            <p className="text-sm text-slate-300 mt-1">{PLAN_LABELS[planKey]}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Fechar">×</button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-bold text-emerald-300">Assinatura registrada no Asaas Sandbox.</p>
              <p className="text-xs text-slate-300 mt-2">A primeira cobrança está prevista para {new Date(result.nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR')}, após o período gratuito, se ainda estiver vigente.</p>
              <p className="text-xs text-slate-300 mt-2">O plano só será liberado após confirmação do pagamento pelo Asaas.</p>
              <p className="text-[10px] font-mono text-slate-400 mt-3 break-all">Referência: {result.subscriptionId}</p>
            </div>
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-950">Concluir</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-200">Nome completo ou razão social</span>
              <input required minLength={3} maxLength={120} value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-lg border border-[#2b3b59] bg-[#0b1120] px-3 py-2.5 text-sm text-white" autoComplete="name" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-200">CPF ou CNPJ</span>
              <input required value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} inputMode="numeric" maxLength={18} placeholder="Somente números ou com pontuação" className="w-full rounded-lg border border-[#2b3b59] bg-[#0b1120] px-3 py-2.5 text-sm text-white" />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-slate-200">Forma de pagamento recorrente</legend>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBillingType('PIX')} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${billingType === 'PIX' ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-[#2b3b59] text-slate-300'}`}>Pix</button>
                <button type="button" onClick={() => setBillingType('BOLETO')} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${billingType === 'BOLETO' ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-[#2b3b59] text-slate-300'}`}>Boleto</button>
              </div>
            </fieldset>
            <p className="text-[11px] leading-relaxed text-slate-400">O cadastro será enviado ao Asaas para criar a assinatura mensal. A primeira cobrança vence após os 30 dias gratuitos. A liberação do plano depende da confirmação do pagamento.</p>
            {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl bg-[#24334a] py-3 text-sm font-semibold text-slate-200">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-60">{loading ? 'Enviando…' : 'Criar assinatura'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
