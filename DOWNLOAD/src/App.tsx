/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  CheckCircle2,
  Cpu,
  Crown,
  DollarSign,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { FieldCardsGrid } from './components/FieldCardsGrid';
import {
  AccountantHubView,
  CardMachinesModal,
  DailyClosingView,
  FeeCalculatorView,
  NewTransactionModal,
} from './components/ModalsAndTools';
import { ReportsSection } from './components/ReportsSection';
import {
  FieldVoiceAndClearBar,
  LiveVoiceCopilotWidget,
} from './components/VoiceFieldControls';
import {
  CardMachine,
  FinancialRecord,
  ReportField,
  ReportPeriod,
  TransactionType,
} from './types/finance';
import {
  computeFieldSummary,
  exportReportToCSV,
  FIELD_LABELS,
  filterRecordsByPeriod,
  formatBRL,
  generateInitialSeedRecords,
  getPeriodRange,
  INITIAL_CARD_MACHINES,
  PERIOD_LABELS,
  toISODate,
} from './utils/financeUtils';

type NavTab =
  | 'painel'
  | 'calculadora'
  | 'fechamento'
  | 'contador'
  | 'openfinance'
  | 'perfil';

const STORAGE_KEY_RECORDS = 'copiloto_financeiro_records_v1';
const STORAGE_KEY_MACHINES = 'copiloto_financeiro_machines_v1';

export default function App() {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [referenceDate, setReferenceDate] = useState<string>(todayISO);
  const [activeNav, setActiveNav] = useState<NavTab>('painel');

  // Master Report State for the 3 requested fields (Vendas, A Receber, A Pagar) and 3 periods (Diário, Semanal, Mensal)
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('diario');
  const [activeField, setActiveField] = useState<ReportField>('todos');

  // Records State with localStorage persistence
  const [records, setRecords] = useState<FinancialRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return generateInitialSeedRecords(toISODate(new Date()));
  });

  // Undo Backup State when the user clicks "X" to clear a field
  const [undoBackup, setUndoBackup] = useState<FinancialRecord[] | null>(null);

  // Card Machines State
  const [machines, setMachines] = useState<CardMachine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MACHINES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CARD_MACHINES;
  });

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalDefaultType, setNewModalDefaultType] =
    useState<TransactionType>('vendas');
  const [isMachinesModalOpen, setIsMachinesModalOpen] = useState(false);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MACHINES, JSON.stringify(machines));
    } catch {
      // ignore
    }
  }, [machines]);

  const showNotification = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  // KPI Summaries for the currently selected period (Diário, Semanal, or Mensal)
  const vendasSummary = useMemo(
    () => computeFieldSummary(records, referenceDate, activePeriod, 'vendas'),
    [records, referenceDate, activePeriod]
  );
  const receberSummary = useMemo(
    () => computeFieldSummary(records, referenceDate, activePeriod, 'receber'),
    [records, referenceDate, activePeriod]
  );
  const pagarSummary = useMemo(
    () => computeFieldSummary(records, referenceDate, activePeriod, 'pagar'),
    [records, referenceDate, activePeriod]
  );

  // Also compute Diário, Semanal, Mensal quick values for each of the 3 KPI cards
  const quickAllPeriods = useMemo(() => {
    return {
      vendas: {
        diario: computeFieldSummary(records, referenceDate, 'diario', 'vendas').totalGross,
        semanal: computeFieldSummary(records, referenceDate, 'semanal', 'vendas').totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'vendas').totalGross,
      },
      receber: {
        diario: computeFieldSummary(records, referenceDate, 'diario', 'receber').totalGross,
        semanal: computeFieldSummary(records, referenceDate, 'semanal', 'receber').totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'receber').totalGross,
      },
      pagar: {
        diario: computeFieldSummary(records, referenceDate, 'diario', 'pagar').totalGross,
        semanal: computeFieldSummary(records, referenceDate, 'semanal', 'pagar').totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'pagar').totalGross,
      },
    };
  }, [records, referenceDate]);

  const saldoPrevisto =
    vendasSummary.totalNet + receberSummary.totalGross - pagarSummary.totalGross;

  const connectedMachinesCount = machines.filter((m) => m.connected).length;
  const periodRange = getPeriodRange(referenceDate, activePeriod);

  // Handlers
  const handleAddRecord = (newRec: Omit<FinancialRecord, 'id'>) => {
    const created: FinancialRecord = {
      ...newRec,
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setRecords((prev) => [created, ...prev]);
    showNotification(
      `Valor adicionado em ${FIELD_LABELS[created.type]}: ${formatBRL(created.grossAmount)}`
    );
  };

  const handleToggleStatus = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextStatus = r.status === 'confirmado' ? 'pendente' : 'confirmado';
        return { ...r, status: nextStatus };
      })
    );
  };

  const handleDeleteRecord = (id: string) => {
    setUndoBackup(records);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification('Valor excluído com sucesso. Clique em "Desfazer" se quiser restaurar.');
  };

  /**
   * Clears/deletes the value of a specific field (vendas, receber, pagar, or todos)
   * for the specified period (diario, semanal, mensal, or todos) when the user clicks "X".
   */
  const handleClearFieldValue = (
    field: TransactionType | 'todos',
    period: ReportPeriod | 'todos'
  ) => {
    setUndoBackup(records);

    if (period === 'todos') {
      setRecords((prev) =>
        field === 'todos' ? [] : prev.filter((r) => r.type !== field)
      );
      showNotification(
        `Todos os valores de ${
          field === 'todos' ? 'todos os campos' : FIELD_LABELS[field]
        } foram apagados (R$ 0,00).`
      );
      return;
    }

    const { start, end } = getPeriodRange(referenceDate, period);
    setRecords((prev) =>
      prev.filter((r) => {
        const inDate = r.date >= start && r.date <= end;
        const inField = field === 'todos' ? true : r.type === field;
        return !(inDate && inField);
      })
    );

    const fieldLabel = field === 'todos' ? 'Saldo Previsto / Todos os Campos' : FIELD_LABELS[field];
    showNotification(
      `Valor ${PERIOD_LABELS[period]} do campo "${fieldLabel}" apagado (R$ 0,00).`
    );
  };

  const handleUndoClear = () => {
    if (undoBackup) {
      setRecords(undoBackup);
      setUndoBackup(null);
      setToastBanner(null);
    }
  };

  const handleToggleMachine = (id: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              connected: !m.connected,
              lastSync: !m.connected ? 'Sincronizado agora' : 'Desconectada',
            }
          : m
      )
    );
  };

  const handleSimulateMachineSync = (machine: CardMachine) => {
    const gross = 540.0;
    const fee = Number(((gross * machine.creditSightRate) / 100).toFixed(2));
    const net = Number((gross - fee).toFixed(2));
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const saleRecord: FinancialRecord = {
      id: `rec-sync-sale-${Date.now()}`,
      type: 'vendas',
      title: `Lote Sincronizado — ${machine.name}`,
      entityName: `Operadora ${machine.brand}`,
      grossAmount: gross,
      feeAmount: fee,
      netAmount: net,
      date: referenceDate,
      time,
      paymentMethod: 'credito_vista',
      status: 'confirmado',
      machineId: machine.id,
      subcategory: `Maquininha ${machine.brand}`,
    };

    const receivableRecord: FinancialRecord = {
      id: `rec-sync-rec-${Date.now() + 1}`,
      type: 'receber',
      title: `Repasse Automático D+${machine.settlementDays} — ${machine.name}`,
      entityName: `${machine.brand} Pagamentos`,
      grossAmount: net,
      feeAmount: 0,
      netAmount: net,
      date: referenceDate,
      time,
      paymentMethod: 'transferencia',
      status: 'pendente',
      machineId: machine.id,
      subcategory: 'Repasse de Maquininha',
    };

    setRecords((prev) => [saleRecord, receivableRecord, ...prev]);
    setIsMachinesModalOpen(false);
    showNotification(
      `Lote de ${formatBRL(gross)} importado da ${machine.name} em Vendas e A Receber!`
    );
  };

  const handleOpenNewModal = (defaultType: TransactionType) => {
    setNewModalDefaultType(defaultType);
    setIsNewModalOpen(true);
  };

  const handleFocusReport = (field: ReportField, period: ReportPeriod) => {
    setActiveField(field);
    setActivePeriod(period);
    setActiveNav('painel');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100">
      {/* Top Emergency / Fire Mode Banner matching mobile app */}
      <div className="bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#1e1b4b] border-b border-rose-500/30 px-4 py-2.5 no-print">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-wide text-white uppercase">
            <span role="img" aria-label="Fogo">🔥</span>
            <span>MODO APAGA INCÊNDIO</span>
          </div>
          <span className="text-[11px] text-rose-200 hidden sm:inline">
            Controle Rápido Diário · Semanal · Mensal
          </span>
        </div>
      </div>

      {/* Logged-in User Bar matching mobile app */}
      <div className="bg-[#0d1424] border-b border-[#1e2d4a] px-4 py-2.5 no-print">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between text-xs">
          <div className="text-slate-300 truncate">
            Logado como: <strong className="text-white">faustoefiscal@gmail.com</strong>
          </div>
          <button
            type="button"
            onClick={() =>
              showNotification('Sessão ativa como faustoefiscal@gmail.com')
            }
            className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-200 font-medium transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* TOP HEADER BAR (3-Zone Contract matching Copiloto Financeiro) */}
        <header className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <a
              href="#painel"
              onClick={(e) => {
                e.preventDefault();
                setActiveNav('painel');
              }}
              className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap"
            >
              Copiloto Financeiro
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-300">
            {[
              { id: 'painel', label: 'Painel', icon: LayoutGrid },
              { id: 'calculadora', label: 'Calculadora', icon: Calculator },
              { id: 'fechamento', label: 'Fechamento Diário', icon: FileText },
              { id: 'contador', label: 'Central Contador', icon: ShieldCheck },
              { id: 'openfinance', label: 'Open Finance', icon: Cpu },
              { id: 'perfil', label: 'Perfil', icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id as NavTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#17233d]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'text-slate-950'
                        : item.id === 'openfinance'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewModal('vendas')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>
        </header>

        {/* Plan & Quick Reset Status Bar */}
        <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shrink-0" />
            <span className="text-slate-300">
              Plano Atual:{' '}
              <strong className="text-emerald-400">
                Freemium / Essencial (Microfone de Voz e Exclusão "X" em Todos os Campos)
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {records.length > 0 ? (
              <button
                type="button"
                onClick={() => handleClearFieldValue('todos', 'todos')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                Zerar Todos os Campos (R$ 0,00)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRecords(generateInitialSeedRecords(todayISO));
                  showNotification(
                    'Dados de exemplo restaurados para os relatórios Diário, Semanal e Mensal!'
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Carregar Dados de Exemplo
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('relatorios-detalhados');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Ver Relatórios Completos
            </button>
          </div>
        </div>

        {/* REAL-TIME GEMINI 3.8 LIVE VOICE CONVERSATION BAR */}
        <LiveVoiceCopilotWidget
          todayISO={referenceDate}
          onAddRecord={handleAddRecord}
          onClearFieldValue={handleClearFieldValue}
        />

        {/* Toast Notification with Undo ("Desfazer") when user deletes/clears a field */}
        {toastBanner && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastBanner}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {undoBackup && (
                <button
                  type="button"
                  onClick={handleUndoClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-md hover:bg-amber-400 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Desfazer Exclusão
                </button>
              )}
              <button
                type="button"
                onClick={() => setToastBanner(null)}
                className="text-emerald-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN VIEW: PAINEL */}
        {activeNav === 'painel' && (
          <main className="space-y-6">
            {/* MASTER PERIOD BAR FOR TOP KPI CARDS (DIÁRIO | SEMANAL | MENSAL) */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-white">
                    Relatórios Diários, Semanais e Mensais: Vendas · A Receber · A Pagar
                  </h1>
                  <p className="text-xs text-slate-400">
                    Período selecionado:{' '}
                    <strong className="text-amber-400">
                      {PERIOD_LABELS[activePeriod]}
                    </strong>{' '}
                    ({periodRange.label})
                  </p>
                </div>
              </div>

              {/* Segmented Period Selector: Diário | Semanal | Mensal */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center p-1 bg-[#0b1120] border border-[#1e2d4a] rounded-xl">
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((period) => {
                    const active = activePeriod === period;
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setActivePeriod(period)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Relatório {PERIOD_LABELS[period]}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    exportReportToCSV(
                      filterRecordsByPeriod(
                        records,
                        referenceDate,
                        activePeriod,
                        activeField
                      ),
                      activePeriod,
                      activeField,
                      periodRange.label
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-[#17233d] hover:bg-[#1f2f52] border border-[#263961] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Exportar {PERIOD_LABELS[activePeriod]}
                </button>
              </div>
            </div>

            {/* 4 MAIN KPI CARDS — Each with Microphone (Voz) AND "X" (Apagar/Excluir Valor) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: VENDAS */}
              <div
                onClick={() => {
                  setActiveField('vendas');
                  const el = document.getElementById('relatorios-detalhados');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-[#131d33] border rounded-2xl p-5 flex flex-col justify-between transition-colors cursor-pointer ${
                  activeField === 'vendas'
                    ? 'border-amber-500'
                    : 'border-[#1e2d4a] hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      {activePeriod === 'diario'
                        ? 'Vendas Hoje'
                        : activePeriod === 'semanal'
                        ? 'Vendas Semana'
                        : 'Vendas Mês'}
                    </span>
                    <FieldVoiceAndClearBar
                      field="vendas"
                      period={activePeriod}
                      currentValue={vendasSummary.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={handleAddRecord}
                      onClearFieldValue={handleClearFieldValue}
                    />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white font-mono-num tracking-tight">
                    {formatBRL(vendasSummary.totalGross)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    {connectedMachinesCount > 0
                      ? `${connectedMachinesCount} maquininhas ativas · ${vendasSummary.count} vendas`
                      : 'Nenhuma maquininha conectada'}
                  </div>
                </div>

                {/* Mini Daily / Weekly / Monthly Breakdown inside Vendas Card */}
                <div className="mt-4 pt-3 border-t border-[#1e2d4a] space-y-1.5 text-[11px] font-mono-num">
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => (
                    <div key={p} className="flex items-center justify-between text-slate-400">
                      <span>{PERIOD_LABELS[p]}:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            p === activePeriod
                              ? 'text-amber-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {formatBRL(quickAllPeriods.vendas[p])}
                        </span>
                        {quickAllPeriods.vendas[p] > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFieldValue('vendas', p);
                            }}
                            title={`Apagar Vendas (${PERIOD_LABELS[p]})`}
                            className="text-rose-400 hover:text-white p-0.5 rounded hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI 2: A RECEBER */}
              <div
                onClick={() => {
                  setActiveField('receber');
                  const el = document.getElementById('relatorios-detalhados');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-[#131d33] border rounded-2xl p-5 flex flex-col justify-between transition-colors cursor-pointer ${
                  activeField === 'receber'
                    ? 'border-emerald-500'
                    : 'border-[#1e2d4a] hover:border-emerald-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      A Receber ({PERIOD_LABELS[activePeriod]})
                    </span>
                    <FieldVoiceAndClearBar
                      field="receber"
                      period={activePeriod}
                      currentValue={receberSummary.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={handleAddRecord}
                      onClearFieldValue={handleClearFieldValue}
                    />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono-num tracking-tight">
                    {formatBRL(receberSummary.totalGross)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    Valores pendentes: {formatBRL(receberSummary.pendingAmount)}
                  </div>
                </div>

                {/* Mini Daily / Weekly / Monthly Breakdown inside A Receber Card */}
                <div className="mt-4 pt-3 border-t border-[#1e2d4a] space-y-1.5 text-[11px] font-mono-num">
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => (
                    <div key={p} className="flex items-center justify-between text-slate-400">
                      <span>{PERIOD_LABELS[p]}:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            p === activePeriod
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {formatBRL(quickAllPeriods.receber[p])}
                        </span>
                        {quickAllPeriods.receber[p] > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFieldValue('receber', p);
                            }}
                            title={`Apagar A Receber (${PERIOD_LABELS[p]})`}
                            className="text-rose-400 hover:text-white p-0.5 rounded hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI 3: A PAGAR */}
              <div
                onClick={() => {
                  setActiveField('pagar');
                  const el = document.getElementById('relatorios-detalhados');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-[#131d33] border rounded-2xl p-5 flex flex-col justify-between transition-colors cursor-pointer ${
                  activeField === 'pagar'
                    ? 'border-rose-500'
                    : 'border-[#1e2d4a] hover:border-rose-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      A Pagar ({PERIOD_LABELS[activePeriod]})
                    </span>
                    <FieldVoiceAndClearBar
                      field="pagar"
                      period={activePeriod}
                      currentValue={pagarSummary.totalGross}
                      todayISO={referenceDate}
                      onAddRecord={handleAddRecord}
                      onClearFieldValue={handleClearFieldValue}
                    />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono-num tracking-tight">
                    {formatBRL(pagarSummary.totalGross)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    Contas em aberto: {formatBRL(pagarSummary.pendingAmount)}
                  </div>
                </div>

                {/* Mini Daily / Weekly / Monthly Breakdown inside A Pagar Card */}
                <div className="mt-4 pt-3 border-t border-[#1e2d4a] space-y-1.5 text-[11px] font-mono-num">
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => (
                    <div key={p} className="flex items-center justify-between text-slate-400">
                      <span>{PERIOD_LABELS[p]}:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            p === activePeriod
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {formatBRL(quickAllPeriods.pagar[p])}
                        </span>
                        {quickAllPeriods.pagar[p] > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFieldValue('pagar', p);
                            }}
                            title={`Apagar A Pagar (${PERIOD_LABELS[p]})`}
                            className="text-rose-400 hover:text-white p-0.5 rounded hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI 4: SALDO PREVISTO */}
              <div
                onClick={() => {
                  setActiveField('todos');
                  const el = document.getElementById('relatorios-detalhados');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#131d33] border border-[#1e2d4a] hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      Saldo Previsto
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <FieldVoiceAndClearBar
                        field="vendas"
                        period={activePeriod}
                        currentValue={
                          vendasSummary.totalGross +
                          receberSummary.totalGross +
                          pagarSummary.totalGross
                        }
                        todayISO={referenceDate}
                        onAddRecord={handleAddRecord}
                        onClearFieldValue={(_, p) => handleClearFieldValue('todos', p)}
                      />
                    </div>
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-bold font-mono-num tracking-tight ${
                      saldoPrevisto >= 0 ? 'text-sky-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(saldoPrevisto)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    Balanço geral ({PERIOD_LABELS[activePeriod]})
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e2d4a] space-y-1.5 text-[11px] font-mono-num">
                  <div className="flex justify-between text-slate-400">
                    <span>Vendas Líquidas:</span>
                    <span className="text-slate-200 font-semibold">
                      {formatBRL(vendasSummary.totalNet)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxas Maquininha:</span>
                    <span className="text-rose-400 font-semibold">
                      - {formatBRL(vendasSummary.totalFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status Caixa:</span>
                    <span className="text-sky-400 font-semibold">
                      {saldoPrevisto >= 0 ? 'Superávit' : 'Atenção'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GREEN CARD MACHINES BANNER */}
            <div className="bg-[#092922] border border-emerald-500/30 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Gerencie e adicione novas maquininhas de cartão ativas ao seu plano atual.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMachinesModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
              >
                Conectar Maquininhas
              </button>
            </div>

            {/* DIRECT FIELD PANELS WITH MICROPHONE & "X" CLEAR BUTTONS */}
            <FieldCardsGrid
              records={records}
              referenceDate={referenceDate}
              todayISO={todayISO}
              onAddRecord={handleAddRecord}
              onToggleStatus={handleToggleStatus}
              onDeleteRecord={handleDeleteRecord}
              onClearFieldValue={handleClearFieldValue}
              onFocusReport={handleFocusReport}
              onOpenNewModal={handleOpenNewModal}
            />

            {/* COMPLETE INTERACTIVE DAILY, WEEKLY, MONTHLY REPORTS SECTION */}
            <ReportsSection
              records={records}
              referenceDate={referenceDate}
              onChangeReferenceDate={setReferenceDate}
              todayISO={todayISO}
              activePeriod={activePeriod}
              onChangePeriod={setActivePeriod}
              activeField={activeField}
              onChangeField={setActiveField}
              onAddRecord={handleAddRecord}
              onToggleStatus={handleToggleStatus}
              onDeleteRecord={handleDeleteRecord}
              onClearFieldValue={handleClearFieldValue}
              onOpenNewModal={handleOpenNewModal}
            />
          </main>
        )}

        {/* SECONDARY NAV VIEWS */}
        {activeNav === 'calculadora' && <FeeCalculatorView machines={machines} />}

        {activeNav === 'fechamento' && (
          <DailyClosingView records={records} referenceDate={referenceDate} />
        )}

        {activeNav === 'contador' && (
          <AccountantHubView records={records} referenceDate={referenceDate} />
        )}

        {activeNav === 'openfinance' && (
          <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              Integração Open Finance Brasil
            </h2>
            <p className="text-xs text-slate-400">
              Conecte suas contas PJ (Cora, Nubank PJ, Itaú Empresas, Banco Inter, Bradesco) para
              conciliação automática dos relatórios Diário, Semanal e Mensal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {['Nubank PJ', 'Banco Inter Empresas', 'Itaú Empresas'].map((bank) => (
                <div
                  key={bank}
                  className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{bank}</div>
                    <div className="text-xs text-emerald-400">Sincronização automática</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      showNotification(`Sincronização Open Finance iniciada com ${bank}.`)
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Sincronizar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNav === 'perfil' && (
          <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Perfil da Empresa & Preferências de Relatório
            </h2>
            <p className="text-xs text-slate-400">
              Seus lançamentos de Vendas, Contas a Receber e Contas a Pagar ficam salvos
              automaticamente neste dispositivo.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRecords(generateInitialSeedRecords(todayISO));
                  showNotification('Base de demonstração recarregada com sucesso.');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#17233d] text-slate-200 rounded-lg border border-[#263961] cursor-pointer"
              >
                Restaurar Dados de Demonstração
              </button>
              <button
                type="button"
                onClick={() => handleClearFieldValue('todos', 'todos')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Limpar Todos os Dados
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <NewTransactionModal
          isOpen={isNewModalOpen}
          defaultType={newModalDefaultType}
          todayISO={referenceDate}
          machines={machines}
          onClose={() => setIsNewModalOpen(false)}
          onSave={handleAddRecord}
        />

        <CardMachinesModal
          isOpen={isMachinesModalOpen}
          machines={machines}
          onClose={() => setIsMachinesModalOpen(false)}
          onToggleMachine={handleToggleMachine}
          onSimulateMachineSync={handleSimulateMachineSync}
        />
      </div>
    </div>
  );
}
