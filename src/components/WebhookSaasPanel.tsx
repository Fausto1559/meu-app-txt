import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  Webhook,
  XCircle,
} from 'lucide-react';
import { FinancialRecord } from '../types/finance';
import { formatBRL } from '../utils/financeUtils';
import { supabase } from '../supabaseClient';

export type WebhookEventType = string;

export interface SaaSWebhookEvent {
  id: string;
  gateway: string;
  eventType: WebhookEventType;
  customerEmail: string;
  amount: number;
  status: 'processado' | 'falha';
  httpStatus: 200 | 500;
  attempts: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export const STORAGE_KEY_WEBHOOK_EVENTS = 'copiloto_webhook_events_v1';

const INITIAL_WEBHOOK_EVENTS: SaaSWebhookEvent[] = [];

interface WebhookSaasPanelProps {
  todayISO: string;
  onAddRecord: (rec: Omit<FinancialRecord, 'id'>) => void;
  onNotify: (msg: string) => void;
}

export const WebhookSaasPanel: React.FC<WebhookSaasPanelProps> = ({
  todayISO,
  onAddRecord,
  onNotify,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<string>(
    'Asaas / PIX & Boleto'
  );
  const [healthResult, setHealthResult] = useState<{ ok: boolean; checks?: Record<string, { ok: boolean; detail: string }> } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [enabledEvents, setEnabledEvents] = useState<{
    pagamento_aprovado: boolean;
    pagamento_recusado: boolean;
    pagamento_estornado: boolean;
  }>({
    pagamento_aprovado: true,
    pagamento_recusado: true,
    pagamento_estornado: true,
  });

  const [events, setEvents] = useState<SaaSWebhookEvent[]>(() => {
    return INITIAL_WEBHOOK_EVENTS;
  });

  const loadEvents = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/admin/webhook-events', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Falha ao consultar eventos.');
      }

      setEvents((payload.events || []).map((item: any) => ({
        id: item.id,
        gateway: 'Asaas',
        eventType: item.event_type,
        customerEmail: item.provider_payment_id || item.provider_subscription_id || '—',
        amount: 0,
        status: item.processing_status === 'processed' ? 'processado' : 'falha',
        httpStatus: item.processing_status === 'processed' ? 200 : 500,
        attempts: item.attempts,
        createdAt: item.received_at,
        processedAt: item.processed_at || undefined,
        errorMessage: item.last_error || (item.processing_status === 'failed' ? 'Processamento pendente de reprocessamento' : undefined),
      })));
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Falha ao consultar eventos Asaas.');
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const webhookUrl = typeof window !== 'undefined'
    ? new URL('/api/webhook', window.location.origin).toString()
    : '/api/webhook';

  const handleCopyUrl = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(webhookUrl).catch(() => {});
    }
    onNotify('URL do Webhook copiada: ' + webhookUrl);
  };

  const handleCheckHealth = async () => {
    setHealthLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa expirada.');

      const response = await fetch('/api/admin/billing-health', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('Não foi possível validar as credenciais.');
      setHealthResult(payload);
      onNotify(payload.ok ? 'Conexões Supabase e Asaas Sandbox validadas.' : 'Uma ou mais conexões precisam de configuração.');
    } catch (error) {
      setHealthResult({ ok: false });
      onNotify(error instanceof Error ? error.message : 'Falha na verificação.');
    } finally {
      setHealthLoading(false);
    }
  };

  const reprocessEvents = async (eventIds: string[]) => {
    if (!eventIds.length) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa expirada.');

      const response = await fetch('/api/admin/webhook-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventIds }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Falha ao reprocessar eventos.');
      }
      onNotify(`Reprocessamento concluído: ${payload.processed} processado(s), ${payload.failed} com falha.`);
      await loadEvents();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Falha ao reprocessar eventos.');
    }
  };

  const handleReprocessEvent = async (eventId: string) => {
    await reprocessEvents([eventId]);
  };

  const handleReprocessAllFailures = async () => {
    await reprocessEvents(events.filter((event) => event.status === 'falha').map((event) => event.id));
  };

  const failedCount = events.filter((e) => e.status === 'falha').length;
  const processedCount = events.filter((e) => e.status === 'processado').length;

  return (
    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-6">
      {/* Cabeçalho dos 5 Passos do SaaS */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1e2d4a] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Webhook className="w-3.5 h-3.5" />
            INTEGRAÇÃO ASAAS · HOMOLOGAÇÃO
          </div>
          <h2 className="text-xl font-bold text-white">
            Recebimento e processamento de eventos Asaas
          </h2>
          <p className="text-xs text-slate-400">
            Fluxo completo de ponta a ponta: Configuração de Eventos · Escuta no
            Servidor · Gravação no Banco · Resposta HTTP 200 OK · Reprocessamento
            de Falhas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void handleCheckHealth()} disabled={healthLoading} className="px-3.5 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-xs font-semibold text-slate-200 disabled:opacity-60">
            {healthLoading ? 'Verificando…' : 'Testar conexões'}
          </button>
          <div className="px-3.5 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-xs">
            <span className="text-slate-400">200 OK Processados: </span>
            <strong className="text-emerald-400">{processedCount}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-xs">
            <span className="text-slate-400">Falhas na Fila: </span>
            <strong className="text-rose-400">{failedCount}</strong>
          </div>
        </div>
      </div>

      {healthResult && (
        <div className={`rounded-xl border p-3 space-y-2 text-xs ${healthResult.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <strong className={healthResult.ok ? 'text-emerald-300' : 'text-amber-300'}>
            {healthResult.ok ? 'Conexões validadas' : 'Há conexões pendentes'}
          </strong>
          {Object.entries(healthResult.checks || {}).map(([name, check]) => (
            <div key={name} className="flex items-start justify-between gap-3">
              <span className="text-slate-300">{name}</span>
              <span className={check.ok ? 'text-emerald-300' : 'text-rose-300'}>{check.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Blindagem de Segurança SaaS - As 5 Camadas */}
      <div className="bg-[#0b1120] border border-emerald-500/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            <span>Blindagem de Segurança SaaS — 5 Camadas Ativas (Acesso Exclusivo Admin)</span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Protegido · Zero Chaves no Frontend
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          {[
            {
              num: '1. API Keys no Backend',
              desc: 'Nenhuma chave secreta exposta no navegador. Segredos isolados em variáveis de servidor.',
            },
            {
              num: '2. Permissões RLS Ativas',
              desc: 'Row Level Security e escopo isolado por conta: cada usuário só enxerga os próprios dados.',
            },
            {
              num: '3. Firewall & HTTPS 443',
              desc: 'Portas fechadas via Serverless + Headers HSTS, X-Frame-Options, CSP e Anti-Sniffing.',
            },
            {
              num: '4. Anti-SQL Injection',
              desc: 'Validação dupla (Frontend + Backend), tipagem estrita e bloqueio de concatenação maliciosa.',
            },
            {
              num: '5. Rate Limit (Porteiro 429)',
              desc: 'Máx. 100 requisições/minuto por usuário. Na 101ª tentativa bloqueia com HTTP 429.',
            },
          ].map((sec) => (
            <div
              key={sec.num}
              className="bg-[#111a2e] border border-[#1e2d4a] rounded-lg p-3 space-y-1"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{sec.num}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {sec.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid dos 5 Passos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          {
            step: 'Passo 1',
            title: 'Configurar Eventos',
            desc: 'Aprovado, Recusado e Estornado ativos no Gateway.',
            icon: ShieldCheck,
          },
          {
            step: 'Passo 2',
            title: 'Escutar Webhook',
            desc: 'Endpoint exige token Asaas e persistência server-side; ativação pendente de credenciais.',
            icon: Server,
          },
          {
            step: 'Passo 3',
            title: 'Guardar no Banco',
            desc: 'Evento único persistido com idempotência e processamento financeiro no servidor.',
            icon: Database,
          },
          {
            step: 'Passo 4',
            title: 'Devolver 200 OK',
            desc: 'HTTP 200 somente após persistência e processamento bem-sucedido.',
            icon: CheckCircle2,
          },
          {
            step: 'Passo 5',
            title: 'Processar Falhas',
            desc: 'Reprocessamento manual disponível para eventos com falha.',
            icon: RefreshCw,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="p-3.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>{item.step}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white">{item.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Passo 1 e Passo 2: Configuração de Gateway, Eventos e Endpoint do Servidor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            1. Configurar Eventos no Gateway de Pagamento
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-slate-400">
              Gateway Conectado:
            </label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#111a2e] border border-[#243659] text-xs text-white"
            >
              <option value="Asaas / PIX & Boleto">Asaas / PIX & Boleto</option>
              <option value="Stripe / Cartão Internacional">
                Stripe / Cartão Internacional
              </option>
              <option value="Mercado Pago / Checkout Transparente">
                Mercado Pago / Checkout Transparente
              </option>
              <option value="Kiwify / Hotmart SaaS">Kiwify / Hotmart SaaS</option>
            </select>
          </div>

          <div className="pt-1 space-y-2">
            <div className="text-xs text-slate-400">
              Eventos habilitados para envio ao Webhook:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'pagamento_aprovado', label: '✅ Pagamento Aprovado' },
                { key: 'pagamento_recusado', label: '❌ Pagamento Recusado' },
                { key: 'pagamento_estornado', label: '↩️ Pagamento Estornado' },
              ].map((ev) => {
                const k = ev.key as keyof typeof enabledEvents;
                return (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() =>
                      setEnabledEvents((prev) => ({ ...prev, [k]: !prev[k] }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      enabledEvents[k]
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#111a2e] border-[#243659] text-slate-400'
                    }`}
                  >
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                2. Escutar o Webhook no Servidor
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                CONFIGURAÇÃO PENDENTE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cole esta URL no painel do seu Gateway (Asaas, Stripe, Mercado
              Pago, Kiwify) para enviar os eventos automaticamente:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                aria-label="URL do Webhook"
                className="w-full px-3 py-2 rounded-lg bg-[#111a2e] border border-[#243659] text-xs font-mono text-slate-200"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar URL
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1e2d4a] flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Eventos reais recebidos e persistidos pelo webhook autenticado do Asaas.</p>
            <button type="button" onClick={() => void loadEvents()} className="px-3 py-2 rounded-lg bg-[#17233d] border border-[#293d66] text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Passo 3, 4 e 5: Tabela de Eventos Guardados no Banco & Reprocessamento */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              3, 4 e 5. Eventos Guardados no Banco de Dados & Fila de
              Reprocessamento
            </h3>
            <p className="text-xs text-slate-400">
              Cada evento recebido ganha uma referência única no banco. O
              servidor só devolve <strong>HTTP 200 OK</strong> quando processado
              com sucesso.
            </p>
          </div>

          {failedCount > 0 && (
            <button
              type="button"
              onClick={handleReprocessAllFailures}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reprocessar Todas as Falhas ({failedCount}) → Devolver 200 OK
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0b1120]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-slate-400">
                <th className="py-3 px-4">ID Referência (Passo 3)</th>
                <th className="py-3 px-4">Gateway / Cliente</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Resposta Gateway (Passo 4)</th>
                <th className="py-3 px-4 text-right">Ação (Passo 5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#111a2e]/60">
                  <td className="py-3 px-4 font-mono text-slate-200">
                    <div>{evt.id}</div>
                    <div className="text-[10px] text-slate-500">
                      {evt.createdAt} · {evt.attempts}ª tentativa
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{evt.gateway}</div>
                    <div className="text-[11px] text-slate-400">
                      {evt.customerEmail}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                      {evt.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {evt.amount > 0 ? formatBRL(evt.amount) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {evt.status === 'processado' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        HTTP 200 OK · Processado
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          HTTP 500 · Falha Salva no Banco
                        </span>
                        {evt.errorMessage && (
                          <div className="text-[10px] text-slate-400">
                            {evt.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {evt.status === 'falha' ? (
                      <button
                        type="button"
                        onClick={() => handleReprocessEvent(evt.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reprocessar → 200 OK
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Concluído (200 OK)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
