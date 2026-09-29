import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Mic,
  MicOff,
  Plus,
  Printer,
  Search,
  X,
} from 'lucide-react';
import {
  FieldPeriodSummary,
  FinancialRecord,
  PaymentMethod,
  ReportField,
  ReportPeriod,
  TransactionStatus,
  TransactionType,
} from '../types/finance';
import {
  buildPeriodBuckets,
  computeFieldSummary,
  exportReportToCSV,
  FIELD_LABELS,
  filterRecordsByPeriod,
  formatBRL,
  formatShortDateBR,
  getPeriodRange,
  PAYMENT_METHOD_LABELS,
  PERIOD_LABELS,
  STATUS_LABELS,
  stepReferenceDate,
} from '../utils/financeUtils';
import {
  FieldVoiceAndClearBar,
  startBrowserVoiceCapture,
} from './VoiceFieldControls';

interface ReportsSectionProps {
  records: FinancialRecord[];
  referenceDate: string;
  onChangeReferenceDate: (date: string) => void;
  todayISO: string;
  activePeriod: ReportPeriod;
  onChangePeriod: (period: ReportPeriod) => void;
  activeField: ReportField;
  onChangeField: (field: ReportField) => void;
  onAddRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  onToggleStatus: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearFieldValue: (field: TransactionType, period: ReportPeriod) => void;
  onOpenNewModal: (defaultType: TransactionType) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  records,
  referenceDate,
  onChangeReferenceDate,
  todayISO,
  activePeriod,
  onChangePeriod,
  activeField,
  onChangeField,
  onAddRecord,
  onToggleStatus,
  onDeleteRecord,
  onClearFieldValue,
  onOpenNewModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchListening, setIsSearchListening] = useState(false);
  const stopSearchMicRef = useRef<(() => void) | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'todos'>('todos');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'todos'>('todos');

  const periodRange = useMemo(
    () => getPeriodRange(referenceDate, activePeriod),
    [referenceDate, activePeriod]
  );

  // Compute all 9 summaries (3 fields x 3 periods) for the instant Daily / Weekly / Monthly Matrix
  const matrixSummaries = useMemo(() => {
    const fields: TransactionType[] = ['vendas', 'receber', 'pagar'];
    const periods: ReportPeriod[] = ['diario', 'semanal', 'mensal'];
    const map: Record<TransactionType, Record<ReportPeriod, FieldPeriodSummary>> = {
      vendas: {} as Record<ReportPeriod, FieldPeriodSummary>,
      receber: {} as Record<ReportPeriod, FieldPeriodSummary>,
      pagar: {} as Record<ReportPeriod, FieldPeriodSummary>,
    };

    for (const f of fields) {
      for (const p of periods) {
        map[f][p] = computeFieldSummary(records, referenceDate, p, f);
      }
    }
    return map;
  }, [records, referenceDate]);

  const buckets = useMemo(
    () => buildPeriodBuckets(records, referenceDate, activePeriod),
    [records, referenceDate, activePeriod]
  );

  const periodRecords = useMemo(() => {
    const base = filterRecordsByPeriod(records, referenceDate, activePeriod, activeField);
    return base.filter((r) => {
      const matchesStatus = statusFilter === 'todos' ? true : r.status === statusFilter;
      const matchesPayment =
        paymentFilter === 'todos' ? true : r.paymentMethod === paymentFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [records, referenceDate, activePeriod, activeField, statusFilter, paymentFilter, searchQuery]);

  const maxChartValue = useMemo(() => {
    let max = 100;
    for (const b of buckets) {
      if (activeField === 'vendas') {
        max = Math.max(max, b.vendasBruto);
      } else if (activeField === 'receber') {
        max = Math.max(max, b.receberTotal);
      } else if (activeField === 'pagar') {
        max = Math.max(max, b.pagarTotal);
      } else {
        max = Math.max(max, b.vendasBruto, b.receberTotal, b.pagarTotal);
      }
    }
    return max;
  }, [buckets, activeField]);

  const focusedSummary: FieldPeriodSummary | null =
    activeField === 'todos' ? null : matrixSummaries[activeField][activePeriod];

  const handleVoiceSearch = () => {
    if (isSearchListening) {
      stopSearchMicRef.current?.();
      setIsSearchListening(false);
      return;
    }
    stopSearchMicRef.current = startBrowserVoiceCapture(
      (text) => setSearchQuery(text),
      (listening) => setIsSearchListening(listening)
    );
  };

  return (
    <section className="space-y-6" id="relatorios-detalhados">
      {/* Header & Master Filter Controls */}
      <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1e2d4a] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <span>Relatórios Financeiros Integrados</span>
              <span aria-hidden="true">·</span>
              <span>Vendas, A Receber e A Pagar</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Central de Relatórios: Diário, Semanal e Mensal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Período ativo: <strong className="text-slate-200">{periodRange.label}</strong>
            </p>
          </div>

          {/* Export & Print Actions */}
          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={() =>
                exportReportToCSV(
                  periodRecords,
                  activePeriod,
                  activeField,
                  periodRange.label
                )
              }
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#17233d] hover:bg-[#1e2e4f] border border-[#293d66] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar Planilha (CSV)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#17233d] hover:bg-[#1e2e4f] border border-[#293d66] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              Imprimir / Salvar PDF
            </button>
            <button
              type="button"
              onClick={() =>
                onOpenNewModal(activeField === 'todos' ? 'vendas' : activeField)
              }
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Filter Row: Period Selector (Diário | Semanal | Mensal) + Field Selector (Vendas | A Receber | A Pagar) + Date Stepper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center no-print">
          {/* 1. Period Tabs: Diário, Semanal, Mensal */}
          <div className="lg:col-span-4">
            <span className="block text-xs text-slate-400 mb-1.5 font-medium">
              1. Periodicidade do Relatório
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b1120] border border-[#1e2d4a] rounded-lg">
              {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => {
                const isActive = activePeriod === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChangePeriod(p)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-[#16213a]'
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Field Tabs: Todos, Vendas, A Receber, A Pagar */}
          <div className="lg:col-span-5">
            <span className="block text-xs text-slate-400 mb-1.5 font-medium">
              2. Campo do Relatório
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b1120] border border-[#1e2d4a] rounded-lg">
              <button
                type="button"
                onClick={() => onChangeField('todos')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  activeField === 'todos'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-[#16213a]'
                }`}
              >
                Todos (3)
              </button>
              <button
                type="button"
                onClick={() => onChangeField('vendas')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  activeField === 'vendas'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-[#16213a]'
                }`}
              >
                Vendas
              </button>
              <button
                type="button"
                onClick={() => onChangeField('receber')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  activeField === 'receber'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-[#16213a]'
                }`}
              >
                A Receber
              </button>
              <button
                type="button"
                onClick={() => onChangeField('pagar')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  activeField === 'pagar'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-[#16213a]'
                }`}
              >
                A Pagar
              </button>
            </div>
          </div>

          {/* 3. Date Navigator */}
          <div className="lg:col-span-3">
            <span className="block text-xs text-slate-400 mb-1.5 font-medium">
              3. Data de Referência
            </span>
            <div className="flex items-center gap-1.5 bg-[#0b1120] border border-[#1e2d4a] rounded-lg p-1">
              <button
                type="button"
                onClick={() =>
                  onChangeReferenceDate(stepReferenceDate(referenceDate, activePeriod, -1))
                }
                title="Período Anterior"
                className="p-2 text-slate-300 hover:text-white hover:bg-[#16213a] rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => {
                  if (e.target.value) onChangeReferenceDate(e.target.value);
                }}
                className="bg-transparent text-xs font-mono-num text-slate-200 flex-1 text-center focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  onChangeReferenceDate(stepReferenceDate(referenceDate, activePeriod, 1))
                }
                title="Próximo Período"
                className="p-2 text-slate-300 hover:text-white hover:bg-[#16213a] rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {referenceDate !== todayISO && (
                <button
                  type="button"
                  onClick={() => onChangeReferenceDate(todayISO)}
                  className="px-2 py-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap cursor-pointer"
                >
                  Hoje
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX: Comparativo Direto Diário vs Semanal vs Mensal para Vendas, A Receber e A Pagar (Com Microfone e "X" em cada linha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Matriz de VENDAS */}
        <div
          onClick={() => onChangeField('vendas')}
          className={`bg-[#111a2e] border rounded-xl p-5 transition-colors cursor-pointer ${
            activeField === 'vendas'
              ? 'border-amber-500/80'
              : 'border-[#1e2d4a] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-slate-400">Relatório Consolidado</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Campo: Vendas
              </h3>
            </div>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-3 divide-y divide-[#1e2d4a]">
            {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => {
              const s = matrixSummaries.vendas[p];
              const isSelected = activePeriod === p;
              return (
                <div
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeField('vendas');
                    onChangePeriod(p);
                  }}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isSelected ? 'bg-amber-500/10' : 'hover:bg-[#16213a]/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        Relatório {PERIOD_LABELS[p]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        · {s.count} {s.count === 1 ? 'venda' : 'vendas'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-num truncate">
                      Líquido: {formatBRL(s.totalNet)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono-num">
                        {formatBRL(s.totalGross)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-num">
                        Ticket: {formatBRL(s.averageTicket)}
                      </div>
                    </div>
                    <FieldVoiceAndClearBar
                      field="vendas"
                      period={p}
                      currentValue={s.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Matriz de A RECEBER */}
        <div
          onClick={() => onChangeField('receber')}
          className={`bg-[#111a2e] border rounded-xl p-5 transition-colors cursor-pointer ${
            activeField === 'receber'
              ? 'border-emerald-500/80'
              : 'border-[#1e2d4a] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-slate-400">Relatório Consolidado</span>
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                Campo: A Receber
              </h3>
            </div>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="space-y-3 divide-y divide-[#1e2d4a]">
            {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => {
              const s = matrixSummaries.receber[p];
              const isSelected = activePeriod === p;
              return (
                <div
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeField('receber');
                    onChangePeriod(p);
                  }}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isSelected ? 'bg-emerald-500/10' : 'hover:bg-[#16213a]/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        Relatório {PERIOD_LABELS[p]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        · {s.count} {s.count === 1 ? 'título' : 'títulos'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-num truncate">
                      Pendente: {formatBRL(s.pendingAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono-num">
                        {formatBRL(s.totalGross)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-num">
                        Recebido: {formatBRL(s.completedAmount)}
                      </div>
                    </div>
                    <FieldVoiceAndClearBar
                      field="receber"
                      period={p}
                      currentValue={s.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Matriz de A PAGAR */}
        <div
          onClick={() => onChangeField('pagar')}
          className={`bg-[#111a2e] border rounded-xl p-5 transition-colors cursor-pointer ${
            activeField === 'pagar'
              ? 'border-rose-500/80'
              : 'border-[#1e2d4a] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-slate-400">Relatório Consolidado</span>
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                Campo: A Pagar
              </h3>
            </div>
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          </div>

          <div className="space-y-3 divide-y divide-[#1e2d4a]">
            {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => {
              const s = matrixSummaries.pagar[p];
              const isSelected = activePeriod === p;
              return (
                <div
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeField('pagar');
                    onChangePeriod(p);
                  }}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isSelected ? 'bg-rose-500/10' : 'hover:bg-[#16213a]/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        Relatório {PERIOD_LABELS[p]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        · {s.count} {s.count === 1 ? 'conta' : 'contas'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-num truncate">
                      Aberto: {formatBRL(s.pendingAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono-num">
                        {formatBRL(s.totalGross)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-num">
                        Pago: {formatBRL(s.completedAmount)}
                      </div>
                    </div>
                    <FieldVoiceAndClearBar
                      field="pagar"
                      period={p}
                      currentValue={s.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evolução Gráfica por Turno (Diário), Dia da Semana (Semanal) ou Semana do Mês (Mensal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <span className="text-xs text-slate-400">
                Desempenho {PERIOD_LABELS[activePeriod]} ({periodRange.label})
              </span>
              <h3 className="text-base font-bold text-white">
                {activeField === 'todos'
                  ? 'Comparativo Vendas vs. A Receber vs. A Pagar'
                  : `Evolução Detalhada — ${FIELD_LABELS[activeField]}`}
              </h3>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {(activeField === 'todos' || activeField === 'vendas') && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
                  Vendas
                </span>
              )}
              {(activeField === 'todos' || activeField === 'receber') && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                  A Receber
                </span>
              )}
              {(activeField === 'todos' || activeField === 'pagar') && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
                  A Pagar
                </span>
              )}
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 items-end pt-4 pb-2 min-h-[210px] border-b border-[#1e2d4a]">
            {buckets.map((b) => {
              const vPct = Math.max(4, Math.round((b.vendasBruto / maxChartValue) * 100));
              const rPct = Math.max(4, Math.round((b.receberTotal / maxChartValue) * 100));
              const pPct = Math.max(4, Math.round((b.pagarTotal / maxChartValue) * 100));

              return (
                <div
                  key={b.dateKey}
                  className="flex flex-col items-center justify-end h-full group"
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-36 px-1">
                    {(activeField === 'todos' || activeField === 'vendas') && (
                      <div
                        style={{ height: `${b.vendasBruto > 0 ? vPct : 3}%` }}
                        title={`Vendas (${b.label}): ${formatBRL(b.vendasBruto)}`}
                        className={`w-full max-w-[18px] rounded-t transition-opacity ${
                          b.vendasBruto > 0
                            ? 'bg-amber-400 group-hover:opacity-90'
                            : 'bg-slate-800'
                        }`}
                      />
                    )}
                    {(activeField === 'todos' || activeField === 'receber') && (
                      <div
                        style={{ height: `${b.receberTotal > 0 ? rPct : 3}%` }}
                        title={`A Receber (${b.label}): ${formatBRL(b.receberTotal)}`}
                        className={`w-full max-w-[18px] rounded-t transition-opacity ${
                          b.receberTotal > 0
                            ? 'bg-emerald-400 group-hover:opacity-90'
                            : 'bg-slate-800'
                        }`}
                      />
                    )}
                    {(activeField === 'todos' || activeField === 'pagar') && (
                      <div
                        style={{ height: `${b.pagarTotal > 0 ? pPct : 3}%` }}
                        title={`A Pagar (${b.label}): ${formatBRL(b.pagarTotal)}`}
                        className={`w-full max-w-[18px] rounded-t transition-opacity ${
                          b.pagarTotal > 0
                            ? 'bg-rose-400 group-hover:opacity-90'
                            : 'bg-slate-800'
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2.5 text-center">
                    <div className="text-xs font-semibold text-slate-200">{b.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono-num">{b.sublabel}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini Bucket Summary Table below chart */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1e2d4a]">
                  <th className="py-2 font-medium">Faixa ({PERIOD_LABELS[activePeriod]})</th>
                  <th className="py-2 font-medium text-right">Vendas Brutas</th>
                  <th className="py-2 font-medium text-right">A Receber</th>
                  <th className="py-2 font-medium text-right">A Pagar</th>
                  <th className="py-2 font-medium text-right">Saldo do Período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]/60 font-mono-num">
                {buckets.map((b) => (
                  <tr key={b.dateKey} className="hover:bg-[#16213a]/50">
                    <td className="py-2 font-sans font-medium text-slate-200">
                      {b.label}{' '}
                      <span className="text-slate-400 font-normal">({b.sublabel})</span>
                    </td>
                    <td className="py-2 text-right text-amber-300">
                      {formatBRL(b.vendasBruto)}
                    </td>
                    <td className="py-2 text-right text-emerald-400">
                      {formatBRL(b.receberTotal)}
                    </td>
                    <td className="py-2 text-right text-rose-400">
                      {formatBRL(b.pagarTotal)}
                    </td>
                    <td
                      className={`py-2 text-right font-semibold ${
                        b.saldoPrevisto >= 0 ? 'text-sky-400' : 'text-rose-400'
                      }`}
                    >
                      {formatBRL(b.saldoPrevisto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Composição por Forma de Pagamento & Categorias */}
        <div className="lg:col-span-4 bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 flex flex-col justify-between space-y-5">
          <div>
            <span className="text-xs text-slate-400">
              Análise de Composição ({PERIOD_LABELS[activePeriod]})
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              {focusedSummary
                ? `Detalhamento de ${FIELD_LABELS[focusedSummary.field]}`
                : 'Resumo Geral do Período'}
            </h3>
          </div>

          {focusedSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-[#0b1120] border border-[#1e2d4a] rounded-lg p-3.5">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Bruto</span>
                  <span className="text-sm font-bold text-white font-mono-num">
                    {formatBRL(focusedSummary.totalGross)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Valor Líquido</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono-num">
                    {formatBRL(focusedSummary.totalNet)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Ticket Médio</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono-num">
                    {formatBRL(focusedSummary.averageTicket)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Vs. Período Anterior</span>
                  <span
                    className={`text-xs font-semibold font-mono-num ${
                      focusedSummary.growthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {focusedSummary.growthPercent >= 0 ? '+' : ''}
                    {focusedSummary.growthPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2.5">
                  Por Origem / Categoria
                </h4>
                {focusedSummary.bySubcategory.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Nenhum lançamento neste período.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {focusedSummary.bySubcategory.map((sub) => (
                      <div key={sub.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-medium">{sub.name}</span>
                          <span className="font-mono-num text-slate-300">
                            {formatBRL(sub.amount)} ({sub.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0b1120] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              focusedSummary.field === 'vendas'
                                ? 'bg-amber-400'
                                : focusedSummary.field === 'receber'
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, sub.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1e2d4a]">
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  Por Meio de Pagamento
                </h4>
                <div className="space-y-1.5 text-xs">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
                    .filter((pm) => focusedSummary.byPaymentMethod[pm] > 0)
                    .map((pm) => (
                      <div key={pm} className="flex items-center justify-between">
                        <span className="text-slate-400">{PAYMENT_METHOD_LABELS[pm]}</span>
                        <span className="font-mono-num text-slate-200 font-medium">
                          {formatBRL(focusedSummary.byPaymentMethod[pm])}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Vendas ({PERIOD_LABELS[activePeriod]})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-amber-400">
                      {formatBRL(matrixSummaries.vendas[activePeriod].totalGross)}
                    </span>
                    <FieldVoiceAndClearBar
                      field="vendas"
                      period={activePeriod}
                      currentValue={matrixSummaries.vendas[activePeriod].totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">A Receber ({PERIOD_LABELS[activePeriod]})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-emerald-400">
                      {formatBRL(matrixSummaries.receber[activePeriod].totalGross)}
                    </span>
                    <FieldVoiceAndClearBar
                      field="receber"
                      period={activePeriod}
                      currentValue={matrixSummaries.receber[activePeriod].totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">A Pagar ({PERIOD_LABELS[activePeriod]})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-rose-400">
                      {formatBRL(matrixSummaries.pagar[activePeriod].totalGross)}
                    </span>
                    <FieldVoiceAndClearBar
                      field="pagar"
                      period={activePeriod}
                      currentValue={matrixSummaries.pagar[activePeriod].totalGross}
                      todayISO={referenceDate}
                      onAddRecord={onAddRecord}
                      onClearFieldValue={onClearFieldValue}
                      compact
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-[#1e2d4a] flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold">Resultado Previsto</span>
                  <span className="font-mono-num font-bold text-sky-400">
                    {formatBRL(
                      matrixSummaries.vendas[activePeriod].totalNet +
                        matrixSummaries.receber[activePeriod].totalGross -
                        matrixSummaries.pagar[activePeriod].totalGross
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  Use o <strong className="text-amber-400">Microfone</strong> ao lado de cada campo
                  para adicionar valores por voz ou o botão{' '}
                  <strong className="text-rose-400">"X"</strong> para apagar/zerar o valor do campo.
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#1e2d4a] flex items-center justify-between text-xs text-slate-400">
            <span>Total de registros listados</span>
            <span className="font-mono-num font-semibold text-slate-200">
              {periodRecords.length} lançamentos
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Ledger Table for the Selected Period & Field */}
      <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Extrato Analítico {PERIOD_LABELS[activePeriod]} —{' '}
              {activeField === 'todos'
                ? 'Vendas, A Receber e A Pagar'
                : FIELD_LABELS[activeField]}
            </h3>
            <p className="text-xs text-slate-400">
              {periodRange.label} · Clique no botão "X" em qualquer linha para apagar/excluir o
              valor.
            </p>
          </div>

          {/* Search with Voice + "X" Clear & Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por voz ou texto..."
                className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg pl-8 pr-14 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Limpar busca (X)"
                    className="p-1 text-rose-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Buscar por voz"
                  className={`p-1 rounded cursor-pointer ${
                    isSearchListening
                      ? 'text-rose-400 animate-pulse'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  {isSearchListening ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'todos')}
              className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="confirmado">Confirmado / Pago</option>
              <option value="pendente">Pendente / A Vencer</option>
              <option value="atrasado">Em Atraso</option>
              <option value="agendado">Agendado</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'todos')}
              className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todos">Todas as Formas</option>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((pm) => (
                <option key={pm} value={pm}>
                  {PAYMENT_METHOD_LABELS[pm]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {periodRecords.length === 0 ? (
          <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-medium text-slate-300">
              Nenhum lançamento encontrado para o relatório {PERIOD_LABELS[activePeriod].toLowerCase()}{' '}
              neste filtro.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Adicione novas vendas, contas a receber ou contas a pagar clicando no botão abaixo ou
              usando o microfone de voz nos cartões.
            </p>
            <button
              type="button"
              onClick={() =>
                onOpenNewModal(activeField === 'todos' ? 'vendas' : activeField)
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Lançamento Agora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1e2d4a]">
                  <th className="py-2.5 px-2 font-medium">Data / Hora</th>
                  <th className="py-2.5 px-2 font-medium">Campo</th>
                  <th className="py-2.5 px-2 font-medium">Descrição & Origem</th>
                  <th className="py-2.5 px-2 font-medium">Pagamento</th>
                  <th className="py-2.5 px-2 font-medium">Situação</th>
                  <th className="py-2.5 px-2 font-medium text-right">Valor Bruto</th>
                  <th className="py-2.5 px-2 font-medium text-right">Taxa</th>
                  <th className="py-2.5 px-2 font-medium text-right">Valor Líquido</th>
                  <th className="py-2.5 px-2 font-medium text-right no-print">Excluir (X)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]/60">
                {periodRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#16213a]/60 transition-colors">
                    <td className="py-3 px-2 font-mono-num whitespace-nowrap text-slate-300">
                      <div>{formatShortDateBR(r.date)}</div>
                      <div className="text-[11px] text-slate-400">{r.time}</div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          r.type === 'vendas'
                            ? 'text-amber-400'
                            : r.type === 'receber'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {FIELD_LABELS[r.type]}
                      </span>
                      <div className="text-[11px] text-slate-400">{r.subcategory}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-100">{r.title}</div>
                      <div className="text-[11px] text-slate-400">{r.entityName}</div>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap text-slate-300">
                      {PAYMENT_METHOD_LABELS[r.paymentMethod]}
                      {r.installments && r.installments > 1 ? ` (${r.installments}x)` : ''}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(r.id)}
                        title="Clique para alternar entre Confirmado/Pago e Pendente"
                        className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:underline ${
                          r.status === 'confirmado'
                            ? 'text-emerald-400'
                            : r.status === 'atrasado'
                            ? 'text-rose-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {r.status === 'confirmado' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {STATUS_LABELS[r.status]}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num font-semibold text-slate-100 whitespace-nowrap">
                      {formatBRL(r.grossAmount)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num text-slate-400 whitespace-nowrap">
                      {r.feeAmount > 0 ? `- ${formatBRL(r.feeAmount)}` : 'R$ 0,00'}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono-num font-bold whitespace-nowrap ${
                        r.type === 'pagar'
                          ? 'text-rose-400'
                          : r.type === 'receber'
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {formatBRL(r.netAmount)}
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap no-print">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        title="Apagar / Excluir este valor (X)"
                        className="inline-flex items-center justify-center p-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
