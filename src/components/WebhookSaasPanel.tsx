import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Webhook,
  XCircle,
} from 'lucide-react';
import { FinancialRecord } from '../types/finance';
import { formatBRL } from '../utils/financeUtils';

export type WebhookEventType =
  | 'pagamento_aprovado'
  | 'pagamento_recusado'
  | 'pagamento_estornado';

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

const INITIAL_WEBHOOK_EVENTS: SaaSWebhookEvent[] = [
  {
    id: 'evt_982341_aprov',
    gateway: 'Asaas / PIX & Cartão',
    eventType: 'pagamento_aprovado',
    customerEmail: 'assinante.pro@empresa.com.br',
    amount: 147.0,
    status: 'processado',
    httpStatus: 200,
    attempts: 1,
    createdAt: '02/10/2026 14:20:10',
    processedAt: '02/10/2026 14:20:11',
  },
  {
    id: 'evt_982342_recus',
    gateway: 'Stripe / Cartão de Crédito',
    eventType: 'pagamento_recusado',
    customerEmail: 'cliente.teste@loja.com.br',
    amount: 97.0,
    status: 'processado',
    httpStatus: 200,
    attempts: 1,
    createdAt: '02/10/2026 15:05:44',
    processedAt: '02/10/2026 15:05:45',
  },
  {
    id: 'evt_982349_falha',
    gateway: 'Mercado Pago / Checkout',
    eventType: 'pagamento_aprovado',
    customerEmail: 'financeiro@comercio.com.br',
    amount: 297.0,
    status: 'falha',
    httpStatus: 500,
    attempts: 1,
    createdAt: '02/10/2026 16:12:03',
    errorMessage:
      'Timeout temporário ao gravar liberação. Evento salvo no banco pronto para reprocessar (Passo 5).',
  },
];

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
  const [enabledEvents, setEnabledEvents] = useState({
    pagamento_aprovado: true,
    pagamento_recusado: true,
    pagamento_estornado: true,
  });

  const [events, setEvents] = useState<SaaSWebhookEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK_EVENTS);
    return saved ? JSON.parse(saved) : INITIAL_WEBHOOK_EVENTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_EVENTS, JSON.stringify(events));
  }, [events]);

  const webhookUrl = 'https://copilotofinanc.app.br/api/webhook';

  const handleCopyUrl = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(webhookUrl).catch(() => {});
    }
    onNotify('URL do Webhook copiada: ' + webhookUrl);
  };

  const applyFinancialEffect = (evt: SaaSWebhookEvent) => {
    if (evt.eventType === 'pagamento_aprovado') {
      onAddRecord({
        type: 'vendas',
        description: `Webhook SaaS Aprovado (${evt.id}) - ${evt.gateway}`,
        grossAmount: evt.amount,
        feeRate: 1.99,
        feeAmount: Number(((evt.amount * 1.99) / 100).toFixed(2)),
        netAmount: Number((evt.amount * (1 - 0.0199)).toFixed(2)),
        date: todayISO,
        time: '12:00',
        paymentMethod: 'pix',
        status: 'confirmado',
        subcategory: 'Assinatura SaaS (Webhook 200 OK)',
      });
    } else if (evt.eventType === 'pagamento_estornado') {
      onAddRecord({
        type: 'pagar',
        description: `Estorno Webhook SaaS (${evt.id}) - ${evt.gateway}`,
        grossAmount: evt.amount,
        feeRate: 0,
        feeAmount: 0,
        netAmount: evt.amount,
        date: todayISO,
        time: '12:00',
        paymentMethod: 'pix',
        status: 'confirmado',
        subcategory: 'Estorno / Chargeback Gateway',
      });
    }
  };

  const triggerWebhookEvent = async (
    eventType: WebhookEventType,
    amount: number,
    simulateFailure = false
  ) => {
    const nowStr = new Date().toLocaleString('pt-BR');
    const eventId = `evt_${Date.now().toString().slice(-6)}`;

    const newEvent: SaaSWebhookEvent = {
      id: eventId,
      gateway: selectedGateway,
      eventType,
      customerEmail: 'cliente.saas@copilotofinanc.app.br',
      amount,
      status: simulateFailure ? 'falha' : 'processado',
      httpStatus: simulateFailure ? 500 : 200,
      attempts: 1,
      createdAt: nowStr,
      processedAt: simulateFailure ? undefined : nowStr,
      errorMessage: simulateFailure
        ? 'Falha simulada no processamento. Evento salvo no banco aguardando reprocessamento (Passo 5).'
        : undefined,
    };

    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          gateway: selectedGateway,
          eventType,
          customerEmail: newEvent.customerEmail,
          amount,
          simulateFailure,
        }),
      });
    } catch {}

    setEvents((prev) => [newEvent, ...prev]);

    if (simulateFailure) {
      onNotify(
        `Passo 3 e 5: Evento ${eventId} salvo no banco com FALHA (HTTP 500). Clique em "Reprocessar" para devolver 200 OK!`
      );
      return;
    }

    applyFinancialEffect(newEvent);
    onNotify(
      `Passo 4 concluído: Webhook ${eventId} salvo, processado e HTTP 200 OK devolvido ao gateway!`
    );
  };

  const handleReprocessEvent = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprocess', eventId }),
      });
    } catch {}

    const nowStr = new Date().toLocaleString('pt-BR');
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'processado',
              httpStatus: 200,
              attempts: e.attempts + 1,
              processedAt: nowStr,
              errorMessage: undefined,
            }
          : e
      )
    );

    applyFinancialEffect(target);
    onNotify(
      `Passo 5 concluído: Evento ${eventId} reprocessado com sucesso! HTTP 200 OK enviado ao gateway.`
    );
  };

  const failedCount = events.filter((e) => e.status === 'falha').length;
  const processedCount = events.filter((e) => e.status === 'processado').length;

  return (
    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1e2d4a] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Webhook className="w-3.5 h-3.5" />
            ARQUITETURA SAAS EM 5 PASSOS ATIVA
          </div>
          <h2 className="text-xl font-bold text-white">
            Processamento de Pagamentos & Webhooks (SaaS)
          </h2>
          <p className="text-xs text-slate-400">
            1. Configurar Eventos · 2. Escutar Webhook · 3. Guardar no Banco · 4. Devolver 200 OK · 5. Reprocessar Falhas
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { step: 'Passo 1', title: 'Configurar Eventos', desc: 'Aprovado, Recusado e Estornado ativos no Gateway.', icon: ShieldCheck },
          { step: 'Passo 2', title: 'Escutar Webhook', desc: 'Servidor recebe POST em /api/webhook em tempo real.', icon: Server },
          { step: 'Passo 3', title: 'Guardar no Banco', desc: 'Salva referência única (evt_id) antes de processar.', icon: Database },
          { step: 'Passo 4', title: 'Devolver 200 OK', desc: 'Retorna HTTP 200 pro Gateway só após processar.', icon: CheckCircle2 },
          { step: 'Passo 5', title: 'Processar Falhas', desc: 'Reprocessa eventos do banco até devolver 200 OK.', icon: RefreshCw },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="p-3.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>{item.step}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white">{item.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            1. Configurar Eventos no Gateway de Pagamento
          </div>
          <select
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111a2e] border border-[#243659] text-xs text-white"
          >
            <option value="Asaas / PIX & Boleto">Asaas / PIX & Boleto</option>
            <option value="Stripe / Cartão Internacional">Stripe / Cartão Internacional</option>
            <option value="Mercado Pago / Checkout Transparente">Mercado Pago / Checkout Transparente</option>
            <option value="Kiwify / Hotmart SaaS">Kiwify / Hotmart SaaS</option>
          </select>
          <div className="flex flex-wrap gap-2 pt-1">
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
                  onClick={() => setEnabledEvents((prev) => ({ ...prev, [k]: !prev[k] }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
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

        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              2. Escutar o Webhook no Servidor
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">ONLINE (POST · HTTP 200)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
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
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => triggerWebhookEvent('pagamento_aprovado', 197.0, false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Simular Aprovado (R$ 197)
            </button>
            <button
              type="button"
              onClick={() => triggerWebhookEvent('pagamento_recusado', 97.0, false)}
              className="px-3 py-1.5 rounded-lg bg-[#17233d] border border-[#293d66] text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Simular Recusado
            </button>
            <button
              type="button"
              onClick={() => triggerWebhookEvent('pagamento_estornado', 197.0, false)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
            >
              Simular Estornado
            </button>
            <button
              type="button"
              onClick={() => triggerWebhookEvent('pagamento_aprovado', 297.0, true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simular Falha (Passo 5)
            </button>
          </div>
        </div>
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
                  <div className="text-[10px] text-slate-500">{evt.createdAt} · {evt.attempts}ª tentativa</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-white">{evt.gateway}</div>
                  <div className="text-[11px] text-slate-400">{evt.customerEmail}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-200">{evt.eventType}</td>
                <td className="py-3 px-4 font-mono font-bold text-white">{formatBRL(evt.amount)}</td>
                <td className="py-3 px-4">
                  {evt.status === 'processado' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HTTP 200 OK · Processado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      HTTP 500 · Falha Salva no Banco
                    </span>
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
                    <span className="text-[11px] text-slate-500">Concluído (200 OK)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};