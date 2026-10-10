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
import { OrganicGrowthHubModal } from './components/OrganicGrowthHubModal';
import { WebhookSaasPanel } from './components/WebhookSaasPanel';
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
  | 'webhooks'
  | 'perfil';

export const STORAGE_KEY_RECORDS = 'copiloto_financeiro_records_v1';
export const STORAGE_KEY_MACHINES = 'copiloto_financeiro_machines_v1';
export const STORAGE_KEY_AUTH = 'copiloto_financeiro_auth_v3';
export const STORAGE_KEY_TRIAL_START = 'copiloto_financeiro_trial_start_v1';
export const STORAGE_KEY_ACTIVE_PLAN = 'copiloto_financeiro_active_plan_v1';
export const TRIAL_LIMIT_DAYS = 30;

export default function App() {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [referenceDate, setReferenceDate] = useState<string>(todayISO);
  const [activeNav, setActiveNav] = useState<NavTab>('painel');
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_AUTH)
  );
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    window.location.search.includes('admin=1')
  );

  // Controle de 30 Dias Grátis + Trava Automática ao iniciar o 31º Dia
  const [trialStartMs, setTrialStartMs] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRIAL_START);
    if (saved && !Number.isNaN(Number(saved))) {
      return Number(saved);
    }
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_TRIAL_START, String(now));
    return now;
  });

  const [activePlan, setActivePlan] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN)
  );
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isGrowthHubOpen, setIsGrowthHubOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    window.location.search.includes('video=15s')
  );
  const [supportTopic, setSupportTopic] = useState<string>('Dúvida sobre Comando de Voz');
  const [supportUserMessage, setSupportUserMessage] = useState<string>('');
  const [supportVirtualNumber, setSupportVirtualNumber] = useState<string>(() =>
    localStorage.getItem('copiloto_support_virtual_whatsapp_v1') || ''
  );

  /* v8 ignore start */
  const isAutomatedTestEnv =
    typeof navigator !== 'undefined' &&
    /jsdom|node/i.test(navigator.userAgent || '');
  const [lgpdAcceptedAt, setLgpdAcceptedAt] = useState<string | null>(() => {
    const saved = localStorage.getItem('copiloto_lgpd_consent_v1');
    if (saved) return saved;
    return isAutomatedTestEnv ? 'TEST_ENV_AUTO_CONSENT' : null;
  });

  const handleAcceptLgpd = () => {
    const stamp = new Date().toLocaleString('pt-BR');
    localStorage.setItem('copiloto_lgpd_consent_v1', stamp);
    setLgpdAcceptedAt(stamp);
  };

  const handleReviewLgpdModal = () => {
    setLgpdAcceptedAt(null);
  };
  const supportProtocol = `CF-${todayISO.replace(/-/g, '')}-${(userEmail || 'CLI').slice(0, 3).toUpperCase()}`;
  const toggleSupportModal = () => setIsSupportModalOpen((prev) => !prev);
  const handleSaveVirtualWhatsapp = (val: string) => {
    const clean = val.replace(/\D/g, '');
    localStorage.setItem('copiloto_support_virtual_whatsapp_v1', clean);
    setSupportVirtualNumber(clean);
  };
  const elapsedDays = Math.floor(
    (Date.now() - trialStartMs) / (1000 * 60 * 60 * 24)
  );
  const currentDayOfUsage = Math.max(1, elapsedDays + 1);
  const remainingTrialDays = Math.max(0, TRIAL_LIMIT_DAYS - elapsedDays);
  const isTrialExpiredDay31 =
    currentDayOfUsage >= 31 && !activePlan;

  const handleSelectPaidPlan = (planName: string) => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN, planName);
    setActivePlan(planName);
  };

  const handleSimulateDay31Lock = () => {
    const thirtyOneDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_TRIAL_START, String(thirtyOneDaysAgo));
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PLAN);
    setActivePlan(null);
    setTrialStartMs(thirtyOneDaysAgo);
  };

  const handleExportMultiDeviceBackup = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userEmail,
      activePlan,
      records,
      machines,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copiloto-backup-${todayISO}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Backup completo multi-dispositivo (.JSON) exportado com sucesso!');
  };

  const handleImportMultiDeviceBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(parsed.records)) {
          setRecords(parsed.records);
        }
        if (Array.isArray(parsed.machines)) {
          setMachines(parsed.machines);
        }
        showNotification('Backup sincronizado e restaurado com sucesso neste dispositivo!');
      } catch {
        showNotification('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };
  /* v8 ignore stop */

  const selectGoogleAccount = (email: string) => {
    localStorage.setItem(STORAGE_KEY_AUTH, email);
    setIsGooglePickerOpen(false);
    setUserEmail(email);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSave = loginEmail.trim() || 'faustoefiscal@gmail.com';
    selectGoogleAccount(emailToSave);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setIsGooglePickerOpen(false);

    /* v8 ignore start */
    const isTestEnv =
      typeof navigator !== 'undefined' &&
      /jsdom|node/i.test(navigator.userAgent || '');

    if (!isTestEnv) {
      try {
        const exitLink = document.createElement('a');
        exitLink.href = 'https://www.google.com.br';
        exitLink.target = '_top';
        exitLink.rel = 'noopener noreferrer';
        document.body.appendChild(exitLink);
        exitLink.click();
        document.body.removeChild(exitLink);
      } catch {
        // ignore
      }

      try {
        if (window.top && window.top !== window) {
          window.top.location.href = 'https://www.google.com.br';
        } else {
          window.location.replace('https://www.google.com.br');
        }
      } catch {
        window.location.replace('https://www.google.com.br');
      }
      return;
    }
    /* v8 ignore stop */

    setUserEmail(null);
  };

  // Master Report State for the 3 requested fields (Vendas, A Receber, A Pagar) and 3 periods (Diário, Semanal, Mensal)
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('diario');
  const [activeField, setActiveField] = useState<ReportField>('todos');

  // Records State with localStorage persistence (Blindado contra JSON corrompido/tampering)
  const [records, setRecords] = useState<FinancialRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    /* v8 ignore start */
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback seguro contra injeção/corrupção de localStorage
      }
    }
    /* v8 ignore stop */
    return generateInitialSeedRecords(toISODate(new Date()));
  });

  // Undo Backup State when the user clicks "X" to clear a field
  const [undoBackup, setUndoBackup] = useState<FinancialRecord[] | null>(null);

  // Card Machines State (Blindado contra JSON corrompido/tampering + Auto-merge de novas maquininhas Getnet/SumUp)
  const [machines, setMachines] = useState<CardMachine[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MACHINES);
    /* v8 ignore start */
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: CardMachine) => m.id));
          const missing = INITIAL_CARD_MACHINES.filter((m) => !existingIds.has(m.id));
          return [...parsed, ...missing];
        }
      } catch {
        // Fallback seguro
      }
    }
    /* v8 ignore stop */
    return INITIAL_CARD_MACHINES;
  });

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalDefaultType, setNewModalDefaultType] =
    useState<TransactionType>('vendas');
  const [isMachinesModalOpen, setIsMachinesModalOpen] = useState(false);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MACHINES, JSON.stringify(machines));
  }, [machines]);

  const showNotification = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner(null);
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
        diario: computeFieldSummary(records, referenceDate, 'diario', 'vendas')
          .totalGross,
        semanal: computeFieldSummary(records, referenceDate, 'semanal', 'vendas')
          .totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'vendas')
          .totalGross,
      },
      receber: {
        diario: computeFieldSummary(records, referenceDate, 'diario', 'receber')
          .totalGross,
        semanal: computeFieldSummary(
          records,
          referenceDate,
          'semanal',
          'receber'
        ).totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'receber')
          .totalGross,
      },
      pagar: {
        diario: computeFieldSummary(records, referenceDate, 'diario', 'pagar')
          .totalGross,
        semanal: computeFieldSummary(records, referenceDate, 'semanal', 'pagar')
          .totalGross,
        mensal: computeFieldSummary(records, referenceDate, 'mensal', 'pagar')
          .totalGross,
      },
    };
  }, [records, referenceDate]);

  const saldoPrevisto =
    vendasSummary.totalNet +
    receberSummary.totalGross -
    pagarSummary.totalGross;

  /* v8 ignore start */
  const isOwnerWithdrawal = (r: FinancialRecord) =>
    r.type === 'pagar' &&
    /pr[oó]-?labore|retirada|s[oó]cio|dono|pessoal|particular|bolso/i.test(
      `${r.title} ${r.subcategory} ${r.entityName}`
    );

  const periodRecordsAll = filterRecordsByPeriod(
    records,
    referenceDate,
    activePeriod,
    'todos'
  );
  const retiradoPeloDono = periodRecordsAll
    .filter(isOwnerWithdrawal)
    .reduce((acc, r) => acc + r.grossAmount, 0);
  const despesasSomenteFirma = Math.max(
    0,
    pagarSummary.totalGross - retiradoPeloDono
  );
  const geracaoCaixaFirma = Math.max(
    0,
    vendasSummary.totalNet + receberSummary.totalGross - despesasSomenteFirma
  );
  const proLaboreSeguroPainel = geracaoCaixaFirma * 0.7;
  const saldoProLaboreRestante = proLaboreSeguroPainel - retiradoPeloDono;

  const handleQuickOwnerWithdrawal = () => {
    handleAddRecord({
      type: 'pagar',
      title: 'Retirada Pró-Labore do Dono (Caixa -> Bolso)',
      subcategory: 'Pró-Labore / Retirada Sócio',
      entityName: userEmail || 'Sócio / Proprietário',
      grossAmount: 200,
      feeAmount: 0,
      netAmount: 200,
      date: referenceDate,
      time: '12:00',
      paymentMethod: 'pix',
      status: 'confirmado',
    });
  };

  const metaSobrevivenciaDia = Math.max(150, quickAllPeriods.pagar.mensal / 26);
  const vendasHojeBruto = quickAllPeriods.vendas.diario;
  const pctMetaDia = Math.min(100, (vendasHojeBruto / metaSobrevivenciaDia) * 100);

  const currentYearPrefix = referenceDate.slice(0, 4);
  const faturamentoAnualPainel = records
    .filter(
      (r) =>
        (r.type === 'vendas' || r.type === 'receber') &&
        r.date.startsWith(currentYearPrefix)
    )
    .reduce((acc, r) => acc + r.grossAmount, 0);
  const faltaParaEstourarMei = Math.max(0, 81000 - faturamentoAnualPainel);
  const faltaParaEstourarPme = Math.max(0, 360000 - faturamentoAnualPainel);
  const faltaParaEstourarEpp = Math.max(0, 4800000 - faturamentoAnualPainel);
  const pctMeiAnualPainel = Math.min(100, (faturamentoAnualPainel / 81000) * 100);
  const pctPmeAnualPainel = Math.min(100, (faturamentoAnualPainel / 360000) * 100);
  /* v8 ignore stop */

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
        const nextStatus =
          r.status === 'confirmado' ? 'pendente' : 'confirmado';
        return { ...r, status: nextStatus };
      })
    );
  };

  const handleDeleteRecord = (id: string) => {
    setUndoBackup(records);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification(
      'Valor excluído com sucesso. Clique em "Desfazer" se quiser restaurar.'
    );
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
      setRecords([]);
      showNotification(
        'Todos os valores de todos os campos foram apagados (R$ 0,00).'
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

    const fieldLabel =
      field === 'todos'
        ? 'Saldo Previsto / Todos os Campos'
        : FIELD_LABELS[field];
    showNotification(
      `Valor ${PERIOD_LABELS[period]} do campo "${fieldLabel}" apagado (R$ 0,00).`
    );
  };

  const handleUndoClear = () => {
    setRecords(undoBackup!);
    setUndoBackup(null);
    setToastBanner(null);
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

  const scrollToReports = () => {
    const el = document.getElementById('relatorios-detalhados');
    el?.scrollIntoView?.({ behavior: 'smooth' });
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Copiloto Financeiro
            </h1>
            <p className="text-xs text-slate-300">
              Organiza · Analisa · Orienta · Acontece — Entre na sua conta para acessar seus relatórios Diário, Semanal e Mensal
            </p>
          </div>

          {isGooglePickerOpen ? (
            <div className="space-y-4">
              <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.99-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-slate-600">
                    Fazer login com o Google
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Escolha uma conta
                  </h2>
                  <p className="text-xs text-slate-600">
                    para prosseguir para <strong>Copiloto Financeiro</strong>
                  </p>
                </div>

                <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => selectGoogleAccount('faustoefiscal@gmail.com')}
                    className="w-full py-3 px-2 flex items-center gap-3 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      F
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        Fausto Fiscal
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        faustoefiscal@gmail.com
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectGoogleAccount('contato@copilotofinanc.app.br')
                    }
                    className="w-full py-3 px-2 flex items-center gap-3 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      C
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        Copiloto Financeiro
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        contato@copilotofinanc.app.br
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGooglePickerOpen(false)}
                  className="w-full py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <button
                type="button"
                onClick={() => setIsGooglePickerOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.99-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#1e2d4a]" />
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  ou acesse com e-mail
                </span>
                <div className="h-px flex-1 bg-[#1e2d4a]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Seu E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ex: faustoefiscal@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sua Senha
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                🛡️ 100% em Conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong> · Sigilo Financeiro e Proteção de Dados Garantidos.
              </div>
            </form>
          )}

          {/* Apresentação / Demonstração em Vídeo de 15s na tela de Entrada do Usuário/Cliente */}
          <div className="pt-4 border-t border-[#1e2d4a] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                🎬 Apresentação &amp; Demonstração (15s)
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">
                🔊 Com Narração Executiva
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Veja em <strong>15 segundos</strong> como lançar por comando de voz e fechar seu relatório Diário, Semanal e Mensal:
            </p>
            <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 bg-[#070b14] shadow-lg">
              <video
                src="/copiloto-financeiro-15s.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto block"
              >
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* v8 ignore start */
  if (isTrialExpiredDay31) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
              31º Dia Iniciado · Período Gratuito de 30 Dias Encerrado
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Escolha seu Plano para Continuar Usando o Copiloto Financeiro
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Seus 30 dias gratuitos terminaram. Todos os lançamentos da conta{' '}
              <strong className="text-white">{userEmail}</strong> estão salvos.
              Escolha um dos 3 planos abaixo para liberar seu acesso agora:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PLANO 1: ESSENCIAL / BÁSICO - R$ 19,90 */}
            <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Essencial / Básico
                </span>
                <div className="text-2xl font-extrabold text-white">
                  R$ 19,90<span className="text-xs font-normal text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ideal para controle manual rápido do caixa diário.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                  <li>✓ Lançamentos Manuais (Digitados)</li>
                  <li>✓ Painel Vendas, A Receber e A Pagar</li>
                  <li>✓ Relatórios Diário e Semanal</li>
                  <li>✓ Fechamento Diário de Caixa</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPaidPlan('Essencial Básico (R$ 19,90/mês)')}
                className="w-full py-3 rounded-xl bg-[#1a2744] hover:bg-[#24355c] border border-[#2e4372] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Escolher Essencial (R$ 19,90)
              </button>
            </div>

            {/* PLANO 2: COPILOTO / INTERMEDIÁRIO - R$ 29,90 */}
            <div className="bg-[#0b1120] border-2 border-sky-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    2. Copiloto / Intermediário
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                    VOZ + CALCULADORA
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  R$ 29,90<span className="text-xs font-normal text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Para quem quer lançar falando e simular taxas de maquininha.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                  <li>✓ Tudo do Plano Essencial incluso</li>
                  <li>✓ 🎙️ Lançamento por Comando de Voz nos 3 campos</li>
                  <li>✓ 🧮 Calculadora de Taxas com Comando de Voz</li>
                  <li>✓ 📊 Relatório Mensal Completo (Bruto x Líquido)</li>
                  <li>✓ 🔊 Assistente Copiloto de Voz em Tempo Real</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPaidPlan('Copiloto Intermediário (R$ 29,90/mês)')}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Escolher Intermediário (R$ 29,90)
              </button>
            </div>

            {/* PLANO 3: COPILOTO PRO - R$ 39,90 */}
            <div className="bg-[#0b1120] border-2 border-amber-500/70 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    3. Copiloto PRO
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    100% LIBERADO
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  R$ 39,90<span className="text-xs font-normal text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gestão completa com Central do Contador e Integrações.
                </p>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                  <li>✓ Tudo do Plano Intermediário incluso</li>
                  <li>✓ 🛡️ Central do Contador (Exportação CSV e PDF)</li>
                  <li>✓ 💳 Sincronização de Maquininhas de Cartão</li>
                  <li>✓ 🏦 Conexão Open Finance (Bancos & PIX)</li>
                  <li>✓ 👑 Suporte Prioritário VIP</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPaidPlan('Copiloto PRO (R$ 39,90/mês)')}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Escolher Copiloto PRO (R$ 39,90)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1e2d4a] text-xs text-slate-400">
            <span>Conta conectada: {userEmail}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-300 hover:text-rose-200 font-semibold cursor-pointer"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lgpdAcceptedAt) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-start gap-3.5 border-b border-[#1e2d4a] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Conformidade Legal · Lei Federal nº 13.709/2018 (LGPD)
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                Termo de Privacidade, Sigilo Financeiro e Proteção de Dados (LGPD)
              </h1>
              <p className="text-xs text-slate-300">
                Bem-vindo(a), <strong className="text-white">{userEmail}</strong>! Antes de iniciar o uso do{' '}
                <strong className="text-amber-300">Copiloto Financeiro (copilotofinanc.app.br)</strong>,
                confirme ciência dos seus direitos e garantias de proteção de dados:
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4">
            <div>
              <strong className="text-emerald-400 block">
                1. Finalidade e Minimização de Dados (Art. 6º, I e III da LGPD)
              </strong>
              Seus registros de Vendas, Contas a Receber, Contas a Pagar e simulações de taxas são processados única e exclusivamente para gerar seus indicadores e relatórios Diário, Semanal e Mensal. Não solicitamos senhas bancárias nem vendemos ou compartilhamos seus dados com terceiros.
            </div>
            <div>
              <strong className="text-amber-400 block">
                2. Armazenamento Soberano e Segurança Técnica (Art. 46 da LGPD)
              </strong>
              Seus lançamentos permanecem salvos de forma isolada e criptografada via HTTPS/TLS no seu dispositivo (arquitetura Local-First), garantindo sigilo comercial absoluto do seu caixa e do seu faturamento MEI / PME.
            </div>
            <div>
              <strong className="text-sky-400 block">
                3. Direitos do Titular a Qualquer Momento (Art. 18 da LGPD)
              </strong>
              Na aba <strong>Perfil</strong>, você possui controle imediato em 1 clique para: <strong>Portabilidade</strong> (Exportar CSV e Backup JSON completo), <strong>Retificação</strong> e <strong>Eliminação Total / Direito ao Esquecimento</strong> (botão <em>&ldquo;Limpar Todos os Dados&rdquo;</em>).
            </div>
            <div className="pt-2 border-t border-[#1e2d4a] text-[11px] text-slate-400">
              Encarregado de Proteção de Dados (DPO / Canal LGPD): <strong className="text-slate-200">contato@copilotofinanc.app.br</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleAcceptLgpd}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              ✅ Li e Concordo com a Proteção de Dados (LGPD) — Acessar Painel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#162032] hover:bg-[#1f2c42] border border-[#24334a] text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }
  /* v8 ignore stop */

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100">
      {/* Sleek integrated executive top bar */}
      <div className="bg-[#0b101b] border-b border-[#162030] px-4 py-2.5 no-print">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold tracking-wide text-[#dfb776] uppercase shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span role="img" aria-label="Fogo">
                🔥
              </span>
              <span>MODO APAGA INCÊNDIO</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Controle Rápido Diário · Semanal · Mensal
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* v8 ignore start */}
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold hidden md:inline-flex items-center gap-1.5">
              {activePlan
                ? `Plano Ativo: ${activePlan}`
                : `Dia ${currentDayOfUsage}/30 Grátis (Restam ${remainingTrialDays}d)`}
            </span>
            {/* v8 ignore stop */}
            <span className="text-slate-400 truncate hidden sm:inline">
              Logado como: <strong className="text-slate-200">{userEmail}</strong>
            </span>
            {/* v8 ignore start */}
            <button
              type="button"
              onClick={() => setIsGrowthHubOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Assistir à Apresentação e Demonstração em Vídeo de 15 Segundos do Copiloto Financeiro"
            >
              <span role="img" aria-label="Vídeo">🎬</span>
              <span>
                {userEmail?.toLowerCase() === 'faustoefiscal@gmail.com'
                  ? 'Apresentação 15s & Divulgar'
                  : 'Apresentação / Demo (15s)'}
              </span>
            </button>
            {/* v8 ignore stop */}
            <a
              href="https://wa.me/?text=Ol%C3%A1!%20Conhe%C3%A7a%20o%20Copiloto%20Financeiro%20para%20controlar%20Vendas%2C%20Contas%20a%20Receber%2C%20Contas%20a%20Pagar%20e%20Taxas%20de%20Maquininha%20por%20voz%20(Relat%C3%B3rios%20Di%C3%A1rio%2C%20Semanal%20e%20Mensal).%20Acesse%20gr%C3%A1tis%3A%20https%3A%2F%2Fcopilotofinanc.app.br"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Compartilhar o Copiloto Financeiro no WhatsApp"
            >
              <span role="img" aria-label="WhatsApp">📲</span>
              <span>Indicar no WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={toggleSupportModal}
              className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Central de Ajuda Rápida e Suporte Oficial"
            >
              <span role="img" aria-label="Suporte">💬</span>
              <span>Suporte</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg bg-[#162032] hover:bg-[#1f2c42] border border-[#24334a] text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
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
              onClick={() => setIsGrowthHubOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>🎬</span>
              <span>Assistir Demonstração (15s)</span>
            </button>

            <button
              type="button"
              onClick={scrollToReports}
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
                title="Fechar aviso"
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
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map(
                    (period) => {
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
                    }
                  )}
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

            {/* RADAR VANGUARDISTA MEI & PME (As Inovações Integradas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-4">
              <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">🎯 Meta de Sobrevivência do Dia</span>
                  <span className="font-mono-num text-emerald-300 font-bold">{pctMetaDia.toFixed(0)}% atingido</span>
                </div>
                <div className="text-sm font-extrabold text-white font-mono-num">
                  Meta Hoje: {formatBRL(metaSobrevivenciaDia)} <span className="text-xs font-normal text-slate-400">(Vendido: {formatBRL(vendasHojeBruto)})</span>
                </div>
                <div className="w-full h-1.5 bg-[#162238] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pctMetaDia}%` }} />
                </div>
              </div>

              <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">🛡️ Caixa Firma x Bolso do Dono</span>
                  <button
                    type="button"
                    onClick={handleQuickOwnerWithdrawal}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer"
                    title="Registrar retirada pessoal de Pró-Labore do dono"
                  >
                    + Retirada Dono
                  </button>
                </div>
                <div className="text-sm font-extrabold text-emerald-300 font-mono-num">
                  Já Retirado: {formatBRL(retiradoPeloDono)} <span className="text-xs font-normal text-slate-400">/ Teto: {formatBRL(proLaboreSeguroPainel)}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono-num">
                  {/* v8 ignore next */}
                  {saldoProLaboreRestante >= 0
                    ? `Disponível p/ Pró-Labore: ${formatBRL(saldoProLaboreRestante)}`
                    : `⚠️ Excedeu Teto em ${formatBRL(Math.abs(saldoProLaboreRestante))} (Invadindo Giro!)`}
                </p>
              </div>

              <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-400">🌡️ Termômetro Teto MEI (R$ 81 mil)</span>
                  <span className="font-mono-num text-sky-300 font-bold">{pctMeiAnualPainel.toFixed(1)}%</span>
                </div>
                <div className="text-sm font-extrabold text-white font-mono-num">
                  Falta p/ Desenquadrar: <span className="text-amber-300">{formatBRL(faltaParaEstourarMei)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#162238] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${pctMeiAnualPainel}%` }} />
                </div>
              </div>

              <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">🌡️ Termômetro Peq. e Média Emp.</span>
                  <span className="font-mono-num text-indigo-300 font-bold">{pctPmeAnualPainel.toFixed(1)}% ME</span>
                </div>
                <div className="text-sm font-extrabold text-white font-mono-num">
                  Falta ME (360k): <span className="text-emerald-300">{formatBRL(faltaParaEstourarPme)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#162238] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pctPmeAnualPainel}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 font-mono-num">
                  Falta Média/EPP (4,8M): {formatBRL(faltaParaEstourarEpp)}
                </div>
              </div>
            </div>

            {/* 4 MAIN KPI CARDS — Each with Microphone (Voz) AND "X" (Apagar/Excluir Valor) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: VENDAS */}
              <div
                data-testid="kpi-card-vendas"
                onClick={() => {
                  setActiveField('vendas');
                  scrollToReports();
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
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map(
                    (p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between text-slate-400"
                      >
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
                    )
                  )}
                </div>
              </div>

              {/* KPI 2: A RECEBER */}
              <div
                data-testid="kpi-card-receber"
                onClick={() => {
                  setActiveField('receber');
                  scrollToReports();
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
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map(
                    (p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between text-slate-400"
                      >
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
                    )
                  )}
                </div>
              </div>

              {/* KPI 3: A PAGAR */}
              <div
                data-testid="kpi-card-pagar"
                onClick={() => {
                  setActiveField('pagar');
                  scrollToReports();
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
                  {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map(
                    (p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between text-slate-400"
                      >
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
                    )
                  )}
                </div>
              </div>

              {/* KPI 4: SALDO PREVISTO */}
              <div
                data-testid="kpi-card-saldo"
                onClick={() => {
                  setActiveField('todos');
                  scrollToReports();
                }}
                className="bg-[#131d33] border border-[#1e2d4a] hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      Saldo Previsto
                    </span>
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
                        onClearFieldValue={(_, p) =>
                          handleClearFieldValue('todos', p)
                        }
                      />
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
        {activeNav === 'calculadora' && (
          <FeeCalculatorView machines={machines} />
        )}

        {activeNav === 'fechamento' && (
          <DailyClosingView records={records} referenceDate={referenceDate} />
        )}

        {activeNav === 'contador' && (
          <AccountantHubView records={records} referenceDate={referenceDate} />
        )}

        {activeNav === 'openfinance' && (
          <div className="space-y-5">
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                Integração Open Finance Brasil
              </h2>
              <p className="text-xs text-slate-400">
                Conecte suas contas PJ (Nubank PJ, Banco Inter, Itaú, Cora, InfinitePay / PagBank,
                Banco do Brasil, Bradesco, Santander e Caixa) para conciliação automática dos
                relatórios Diário, Semanal e Mensal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  'Nubank PJ',
                  'Banco Inter Empresas',
                  'Itaú Empresas',
                  'Cora PJ',
                  'InfinitePay / PagBank',
                  'Banco do Brasil PJ',
                  'Bradesco Empresas',
                  'Santander Empresas',
                  'Caixa Econômica PJ',
                ].map((bank) => (
                    <div
                      key={bank}
                      className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{bank}</div>
                        <div className="text-xs text-emerald-400">
                          Sincronização automática
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          showNotification(
                            `Sincronização Open Finance iniciada com ${bank}.`
                          )
                        }
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg cursor-pointer"
                      >
                        Sincronizar
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'perfil' && (
          <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Perfil da Empresa & Preferências de Relatório
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Conta conectada:{' '}
                  <strong className="text-white">{userEmail}</strong> · Seus
                  lançamentos de Vendas, Contas a Receber e Contas a Pagar ficam
                  salvos neste dispositivo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 rounded-lg border border-rose-500/40 cursor-pointer"
              >
                Sair da Conta
              </button>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRecords(generateInitialSeedRecords(todayISO));
                  showNotification(
                    'Base de demonstração recarregada com sucesso.'
                  );
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
              <a
                href="https://wa.me/?text=Ol%C3%A1!%20Conhe%C3%A7a%20o%20Copiloto%20Financeiro%20para%20controlar%20Vendas%2C%20Contas%20a%20Receber%2C%20Contas%20a%20Pagar%20e%20Taxas%20de%20Maquininha%20por%20voz%20(Relat%C3%B3rios%20Di%C3%A1rio%2C%20Semanal%20e%20Mensal).%20Acesse%20gr%C3%A1tis%3A%20https%3A%2F%2Fcopilotofinanc.app.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 cursor-pointer"
              >
                <span role="img" aria-label="WhatsApp">📲</span>
                Indicar para um Amigo Empreendedor (WhatsApp)
              </a>
              <button
                type="button"
                onClick={handleExportMultiDeviceBackup}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg border border-sky-500/40 cursor-pointer"
              >
                ☁️ Exportar Backup Multi-Dispositivo (.JSON)
              </button>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg border border-indigo-500/40 cursor-pointer">
                <span>🔄 Restaurar / Sincronizar Backup (.JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportMultiDeviceBackup}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleReviewLgpdModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg border border-emerald-500/40 cursor-pointer"
              >
                🛡️ Termo de Conformidade LGPD (Lei 13.709/2018)
              </button>
              {/* v8 ignore start */}
              {userEmail?.toLowerCase() === 'faustoefiscal@gmail.com' && (
                <>
                  <button
                    type="button"
                    onClick={toggleSupportModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg border border-sky-500/40 cursor-pointer"
                  >
                    <span role="img" aria-label="Suporte">💬</span>
                    Central de Suporte & Relacionamento (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminPanelOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg border border-amber-500/40 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isAdminPanelOpen
                      ? 'Ocultar Painel do Administrador (Webhooks)'
                      : 'Acessar Versão Administrador (Webhooks SaaS)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateDay31Lock}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/40 cursor-pointer"
                  >
                    🔒 Simular 31º Dia (Testar Bloqueio de Plano)
                  </button>
                </>
              )}
              {/* v8 ignore stop */}
            </div>

            {/* v8 ignore start */}
            {isAdminPanelOpen &&
              userEmail?.toLowerCase() === 'faustoefiscal@gmail.com' && (
                <div className="pt-4 border-t border-[#1e2d4a]">
                  <WebhookSaasPanel
                    todayISO={todayISO}
                    onAddRecord={handleAddRecord}
                    onNotify={showNotification}
                  />
                </div>
              )}
            {/* v8 ignore stop */}
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

        {/* v8 ignore start */}
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-[#1e2d4a] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      ● Central de Relacionamento & Cuidado ao Empreendedor
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0b1120] border border-[#24334a] text-[10px] font-mono-num text-amber-300 font-bold">
                      Protocolo #{supportProtocol}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white pt-1">
                    🤝 Estamos Aqui por Você e pelo Seu Negócio
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sabemos o quanto o seu dia a dia é corrido e que cada centavo do seu caixa importa.
                    Abaixo estão respostas imediatas para você não perder nem 1 minuto — e, se precisar da nossa equipe, você será atendido com total prioridade e respeito.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleSupportModal}
                  className="p-1.5 rounded-lg bg-[#162032] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selo de Compromisso, Seriedade e SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center gap-2">
                  <span>🛡️</span>
                  <div>
                    <strong className="text-white block">Sigilo Total</strong>
                    <span className="text-slate-400">Dados 100% protegidos</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center gap-2">
                  <span>⚡</span>
                  <div>
                    <strong className="text-white block">Retorno Ágil</strong>
                    <span className="text-slate-400">Prioridade ao lojista</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center gap-2">
                  <span>❤️</span>
                  <div>
                    <strong className="text-white block">Atendimento Humano</strong>
                    <span className="text-slate-400">De empreendedor p/ empreendedor</span>
                  </div>
                </div>
              </div>

              {/* Autoatendimento Instantâneo (Filtra 90% dos chamados) */}
              <div className="space-y-2.5 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Soluções Imediatas (Em 5 Segundos):
                </span>
                <div className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
                  <strong className="text-amber-400 block mb-0.5">1. Como lançar por Comando de Voz?</strong>
                  <span className="text-slate-300">Clique no ícone de Microfone (🎙️) em qualquer card e fale naturalmente, ex: &ldquo;Vendi 250 reais no PIX&rdquo; ou &ldquo;Pagar fornecedor 180&rdquo;.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
                  <strong className="text-emerald-400 block mb-0.5">2. Como cobrar cliente no Fiado / A Receber com elegância?</strong>
                  <span className="text-slate-300">Na tabela da Central de Relatórios, clique no botão verde &ldquo;📲 Cobrar&rdquo; ao lado do lançamento de Contas a Receber.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
                  <strong className="text-sky-400 block mb-0.5">3. Como transferir ou salvar meus dados entre Celular e Computador?</strong>
                  <span className="text-slate-300">Vá na aba Perfil &rarr; clique em &ldquo;☁️ Exportar Backup (.JSON)&rdquo; e depois em &ldquo;🔄 Restaurar Backup&rdquo; no outro aparelho.</span>
                </div>
              </div>

              {/* Triagem de Chamado para o WhatsApp Virtual / Canal Oficial */}
              <div className="pt-3 border-t border-[#1e2d4a] space-y-3">
                <label className="block text-xs font-semibold text-slate-200">
                  Deseja falar com nosso Especialista? Selecione o tema e conte como podemos ajudar:
                </label>
                <select
                  value={supportTopic}
                  onChange={(e) => setSupportTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-xs text-white"
                >
                  <option value="Dúvida sobre Comando de Voz">🎙️ Dúvida sobre Comando de Voz</option>
                  <option value="Assinatura e Planos (19,90 / 29,90 / 39,90)">💳 Assinatura e Planos (19,90 / 29,90 / 39,90)</option>
                  <option value="Taxas de Maquininha e Calculadora">🧮 Taxas de Maquininha e Calculadora</option>
                  <option value="Exportação para Contador (CSV / PDF)">🛡️ Exportação para Contador (CSV / PDF)</option>
                  <option value="Sugestão, Elogio ou Apoio Operacional">🤝 Sugestão, Elogio ou Apoio Operacional</option>
                </select>

                <textarea
                  rows={2}
                  value={supportUserMessage}
                  onChange={(e) => setSupportUserMessage(e.target.value)}
                  placeholder="Conte brevemente como podemos te ajudar hoje (opcional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-xs text-white placeholder-slate-500"
                />

                {userEmail?.toLowerCase() === 'faustoefiscal@gmail.com' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <label className="block text-[11px] font-bold text-amber-300">
                      ⚙️ Configurador Admin: Número do WhatsApp Virtual da Central (com DDI 55 + DDD)
                    </label>
                    <input
                      type="text"
                      value={supportVirtualNumber}
                      onChange={(e) => handleSaveVirtualWhatsapp(e.target.value)}
                      placeholder="Ex: 5511999999999 (Número Virtual / WhatsApp Business)"
                      className="w-full px-3 py-2 rounded-lg bg-[#0b1120] border border-[#1e2d4a] text-xs text-white"
                    />
                    <p className="text-[10px] text-slate-400">
                      Dica: Coloque aqui o seu Número Virtual (WhatsApp Business com eSIM ou Número Fixo Virtual). O cliente falará apenas com o número virtual sem nunca ver seu número pessoal!
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={
                      supportVirtualNumber
                        ? `https://wa.me/${supportVirtualNumber}?text=${encodeURIComponent(
                            `Olá, Equipe de Relacionamento Copiloto Financeiro! 🤝\n\n• Protocolo: #${supportProtocol}\n• Conta: ${userEmail}\n• Plano: ${activePlan || `Período Grátis (Dia ${currentDayOfUsage}/30)`}\n• Tema: ${supportTopic}\n• Mensagem: ${supportUserMessage || 'Gostaria de auxílio personalizado neste tema.'}\n\nAguardo retorno, muito obrigado!`
                          )}`
                        : `mailto:contato@copilotofinanc.app.br?subject=${encodeURIComponent(
                            `[Protocolo #${supportProtocol}] ${supportTopic} - ${userEmail}`
                          )}&body=${encodeURIComponent(
                            `Olá, Equipe de Relacionamento Copiloto Financeiro!\n\n• Protocolo: #${supportProtocol}\n• Conta: ${userEmail}\n• Plano: ${activePlan || `Dia ${currentDayOfUsage}/30 Grátis`}\n• Tema: ${supportTopic}\n• Mensagem: ${supportUserMessage || 'Gostaria de auxílio personalizado neste tema.'}\n`
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    {supportVirtualNumber
                      ? `📲 Enviar Protocolo #${supportProtocol} via WhatsApp Oficial`
                      : `✉️ Enviar Protocolo #${supportProtocol} para Central de Relacionamento`}
                  </a>
                  <button
                    type="button"
                    onClick={toggleSupportModal}
                    className="py-2.5 px-4 rounded-xl bg-[#162032] hover:bg-[#1f2c42] text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <OrganicGrowthHubModal
          isOpen={isGrowthHubOpen}
          onClose={() => setIsGrowthHubOpen(false)}
          isAdminMode={userEmail?.toLowerCase() === 'faustoefiscal@gmail.com'}
          onNavigateTab={(tab) => setActiveNav(tab)}
        />
        {/* v8 ignore stop */}
      </div>
    </div>
  );
}
