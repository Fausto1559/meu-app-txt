import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MicOff,
  Plus,
  Send,
  X,
} from 'lucide-react';
import {
  FinancialRecord,
  ReportField,
  ReportPeriod,
  TransactionType,
} from '../types/finance';
import {
  computeFieldSummary,
  filterRecordsByPeriod,
  formatBRL,
  formatShortDateBR,
  parsePortugueseVoiceCommand,
  PAYMENT_METHOD_LABELS,
  PERIOD_LABELS,
  STATUS_LABELS,
} from '../utils/financeUtils';

interface FieldCardsGridProps {
  records: FinancialRecord[];
  referenceDate: string;
  todayISO: string;
  onAddRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  onToggleStatus: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearFieldValue: (field: TransactionType, period: ReportPeriod) => void;
  onFocusReport: (field: ReportField, period: ReportPeriod) => void;
  onOpenNewModal: (defaultType: TransactionType) => void;
}

interface SingleFieldPanelProps extends FieldCardsGridProps {
  field: TransactionType;
  title: string;
  subtitle: string;
  accentColor: 'amber' | 'emerald' | 'rose';
}

const SingleFieldPanel: React.FC<SingleFieldPanelProps> = ({
  field,
  title,
  subtitle,
  accentColor,
  records,
  referenceDate,
  todayISO,
  onAddRecord,
  onToggleStatus,
  onDeleteRecord,
  onClearFieldValue,
  onFocusReport,
  onOpenNewModal,
}) => {
  const [localPeriod, setLocalPeriod] = useState<ReportPeriod>('diario');
  const [isListening, setIsListening] = useState(false);
  const [quickCommand, setQuickCommand] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const summary = computeFieldSummary(records, referenceDate, localPeriod, field);
  const list = filterRecordsByPeriod(records, referenceDate, localPeriod, field);

  const handleVoiceToggle = () => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionAPI =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setFeedbackMsg(
        'Digite ou fale o comando abaixo (ex: "350 reais no Pix hoje")'
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognitionAPI as any)();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setFeedbackMsg(`Ouvindo voz para ${title} (${PERIOD_LABELS[localPeriod]})...`);

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setQuickCommand(transcript);
          const parsed = parsePortugueseVoiceCommand(transcript, field, todayISO);
          onAddRecord({ ...parsed, type: field });
          setFeedbackMsg(
            `Adicionado por voz: ${parsed.title} (${formatBRL(parsed.grossAmount)})`
          );
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setFeedbackMsg(
          'Microfone bloqueado no navegador. Digite o valor abaixo para lançar:'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommand.trim()) return;
    const parsed = parsePortugueseVoiceCommand(quickCommand, field, todayISO);
    onAddRecord({ ...parsed, type: field });
    setFeedbackMsg(
      `Lançamento adicionado em ${title}: ${formatBRL(parsed.grossAmount)}`
    );
    setQuickCommand('');
  };

  const colorClasses = {
    amber: {
      valueText: 'text-white',
      accentText: 'text-amber-400',
      activeTab: 'bg-amber-500 text-slate-950',
      borderHover: 'hover:border-amber-500/50',
    },
    emerald: {
      valueText: 'text-emerald-400',
      accentText: 'text-emerald-400',
      activeTab: 'bg-emerald-500 text-slate-950',
      borderHover: 'hover:border-emerald-500/50',
    },
    rose: {
      valueText: 'text-rose-400',
      accentText: 'text-rose-400',
      activeTab: 'bg-rose-500 text-white',
      borderHover: 'hover:border-rose-500/50',
    },
  }[accentColor];

  return (
    <div
      className={`bg-[#111a2e] border border-[#1e2d4a] ${colorClasses.borderHover} rounded-xl p-5 flex flex-col justify-between transition-colors space-y-4`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={`Falar valor por voz em ${title}`}
              className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 border text-xs font-semibold transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-[#17233d] hover:bg-[#1f2f52] border-[#263961] text-amber-300'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>Voz</span>
            </button>

            <button
              type="button"
              onClick={() => onClearFieldValue(field, localPeriod)}
              disabled={summary.totalGross <= 0}
              title={`Apagar / Excluir valor de ${title} (${PERIOD_LABELS[localPeriod]})`}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                summary.totalGross > 0
                  ? 'bg-rose-500/15 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 hover:text-white cursor-pointer'
                  : 'bg-[#0b1120]/50 border-[#1e2d4a] text-slate-600 cursor-not-allowed'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onOpenNewModal(field)}
              title={`Adicionar manualmente em ${title}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#17233d] hover:bg-[#1f2f52] border border-[#263961] text-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b1120] border border-[#1e2d4a] rounded-lg">
          {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setLocalPeriod(p)}
              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                localPeriod === p
                  ? colorClasses.activeTab
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="pt-1 flex items-center justify-between bg-[#0b1120]/80 border border-[#1e2d4a] rounded-xl px-3.5 py-2.5">
          <div>
            <div className="text-[11px] text-slate-400">
              Total {PERIOD_LABELS[localPeriod]} ({summary.count}{' '}
              {summary.count === 1 ? 'lançamento' : 'lançamentos'})
            </div>
            <div
              className={`text-2xl font-bold font-mono-num ${colorClasses.valueText}`}
            >
              {formatBRL(summary.totalGross)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right font-mono-num text-xs mr-1">
              {field === 'vendas' ? (
                <>
                  <div className="text-slate-400">Líquido</div>
                  <div className="text-emerald-400 font-semibold">
                    {formatBRL(summary.totalNet)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-slate-400">
                    {field === 'receber' ? 'Em aberto' : 'A vencer'}
                  </div>
                  <div className={colorClasses.accentText + ' font-semibold'}>
                    {formatBRL(summary.pendingAmount + summary.overdueAmount)}
                  </div>
                </>
              )}
            </div>

            {summary.totalGross > 0 && (
              <button
                type="button"
                onClick={() => onClearFieldValue(field, localPeriod)}
                title={`Zerar / Excluir valor ${PERIOD_LABELS[localPeriod]} de ${title}`}
                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleQuickSubmit}
          className="bg-[#0b1120] border border-[#263961] rounded-lg p-2.5 space-y-1.5"
        >
          {feedbackMsg && (
            <div className="flex items-center justify-between text-[11px] text-amber-300">
              <span>{feedbackMsg}</span>
              <button
                type="button"
                title="Fechar mensagem do campo"
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={quickCommand}
                onChange={(e) => setQuickCommand(e.target.value)}
                placeholder={
                  field === 'vendas'
                    ? 'Fale ou digite: "Venda 450 reais Pix"'
                    : field === 'receber'
                    ? 'Fale ou digite: "Receber 980 cliente João"'
                    : 'Fale ou digite: "Pagar fornecedor 620"'
                }
                className="w-full bg-[#111a2e] border border-[#1e2d4a] rounded-md pl-2.5 pr-14 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="absolute right-1 flex items-center gap-0.5">
                {quickCommand && (
                  <button
                    type="button"
                    onClick={() => setQuickCommand('')}
                    title="Apagar texto deste campo"
                    className="p-1 text-rose-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  title={`Ditar por voz em ${title}`}
                  className={`p-1 rounded cursor-pointer ${
                    isListening
                      ? 'text-rose-400 animate-pulse'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              Lançar
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#1e2d4a]">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Lançamentos ({PERIOD_LABELS[localPeriod]})</span>
          <span>Valor / Excluir (X)</span>
        </div>

        {list.length === 0 ? (
          <div className="py-5 text-center text-xs text-slate-500">
            Campo zerado (R$ 0,00) no período {PERIOD_LABELS[localPeriod].toLowerCase()}. Use o
            microfone acima para lançar por voz.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {list.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-lg bg-[#0b1120]/90 border border-[#1e2d4a]/70 hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{formatShortDateBR(item.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold font-mono-num ${colorClasses.accentText}`}
                    >
                      {formatBRL(item.grossAmount)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item.id)}
                      className={`text-[10px] inline-flex items-center gap-1 hover:underline cursor-pointer ${
                        item.status === 'confirmado'
                          ? 'text-emerald-400'
                          : item.status === 'atrasado'
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {item.status === 'confirmado' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {STATUS_LABELS[item.status].split(' / ')[0]}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteRecord(item.id)}
                    title={`Excluir este valor (${formatBRL(item.grossAmount)})`}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#1e2d4a] flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono-num">
          Ticket médio: {formatBRL(summary.averageTicket)}
        </span>
        <button
          type="button"
          onClick={() => {
            onFocusReport(field, localPeriod);
            document
              .getElementById('relatorios-detalhados')
              ?.scrollIntoView?.({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Ver Relatório {PERIOD_LABELS[localPeriod]} Completo
        </button>
      </div>
    </div>
  );
};

export const FieldCardsGrid: React.FC<FieldCardsGridProps> = (props) => {
  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white">
            Controle por Campo com Microfone de Voz e Botão "X" (Apagar Valor)
          </h2>
          <p className="text-xs text-slate-400">
            Cada campo possui comando de voz direto (ícone de microfone) e botão "X" para zerar ou
            excluir valores quando você quiser nos períodos Diário, Semanal e Mensal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SingleFieldPanel
          field="vendas"
          title="Campo: Vendas"
          subtitle="Maquininhas, Pix e Balcão"
          accentColor="amber"
          {...props}
        />
        <SingleFieldPanel
          field="receber"
          title="Campo: Contas a Receber"
          subtitle="Repasses de cartão, boletos e clientes"
          accentColor="emerald"
          {...props}
        />
        <SingleFieldPanel
          field="pagar"
          title="Campo: Contas a Pagar"
          subtitle="Fornecedores, impostos e contas fixas"
          accentColor="rose"
          {...props}
        />
      </div>
    </section>
  );
};
