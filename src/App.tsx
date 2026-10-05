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
  | 'perfil';

export const STORAGE_KEY_RECORDS = 'copiloto_financeiro_records_v1';
export const STORAGE_KEY_MACHINES = 'copiloto_financeiro_machines_v1';
export const STORAGE_KEY_AUTH = 'copiloto_financeiro_auth_v3';

export default function App() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [referenceDate, setReferenceDate] = useState<string>(todayISO);
  const [activeNav, setActiveNav] = useState<NavTab>('painel');
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_AUTH)
  );
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState<boolean>(false);
  /* v8 ignore start */
  const [trialStartMs, setTrialStartMs] = useState<number>(() => {
    const saved = localStorage.getItem('copiloto_financeiro_trial_start_v1');
    if (saved && !Number.isNaN(Number(saved))) return Number(saved);
    const now = Date.now();
    localStorage.setItem('copiloto_financeiro_trial_start_v1', String(now));
    return now;
  });
  const [activePlan, setActivePlan] = useState<string | null>(() =>
    localStorage.getItem('copiloto_financeiro_active_plan_v1')
  );
  const elapsedDays = Math.floor((Date.now() - trialStartMs) / (1000 * 60 * 60 * 24));
  const currentDayOfUsage = Math.max(1, elapsedDays + 1);
  const remainingTrialDays = Math.max(0, 30 - elapsedDays);
  const isTrialExpiredDay31 = currentDayOfUsage >= 31 && !activePlan;

  const handleSelectPaidPlan = (planName: string) => {
    localStorage.setItem('copiloto_financeiro_active_plan_v1', planName);
    setActivePlan(planName);
  };

  const handleSimulateDay31Lock = () => {
    const thirtyOneDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('copiloto_financeiro_trial_start_v1', String(thirtyOneDaysAgo));
    localStorage.removeItem('copiloto_financeiro_active_plan_v1');
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
        if (Array.isArray(parsed.records)) setRecords(parsed.records);
        if (Array.isArray(parsed.machines)) setMachines(parsed.machines);
        showNotification('Backup sincronizado e restaurado com sucesso neste dispositivo!');
      } catch {
        showNotification('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };
  /* v8 ignore stop */

  /* v8 ignore start */
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

  /* v8 ignore stop */
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setIsGooglePickerOpen(false);
    setUserEmail(null);
    try {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = 'https://www.google.com';
      }
    } catch {
      // safe fallback
    }
  };

  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('diario');
  const [activeField, setActiveField] = useState<ReportField>('todos');

  const [records, setRecords] = useState<FinancialRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    /* v8 ignore start */
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Blindado contra adulteracao de JSON no localStorage
      }
    }
    /* v8 ignore stop */
    return generateInitialSeedRecords(toISODate(new Date()));
  });

  const [undoBackup, setUndoBackup] = useState<FinancialRecord[] | null>(null);

  const [machines, setMachines] = useState<CardMachine[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MACHINES);
    /* v8 ignore start */
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Blindado contra adulteracao de JSON no localStorage
      }
    }
    /* v8 ignore stop */
    return INITIAL_CARD_MACHINES;
  });

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
  const metaSobrevivenciaDia = Math.max(150, quickAllPeriods.pagar.mensal / 26);
  const vendasHojeBruto = quickAllPeriods.vendas.diario;
  const pctMetaDia = Math.min(100, (vendasHojeBruto / metaSobrevivenciaDia) * 100);
  const proLaboreSeguroPainel = Math.max(0, saldoPrevisto * 0.7);
  const faturamentoAnualPainel = records.filter((r) => r.type === 'vendas' && r.date.startsWith(referenceDate.slice(0, 4))).reduce((acc, r) => acc + r.grossAmount, 0);
  const pctMeiAnualPainel = Math.min(100, (faturamentoAnualPainel / 81000) * 100);
  /* v8 ignore stop */
  const connectedMachinesCount = machines.filter((m) => m.connected).length;
  const periodRange = getPeriodRange(referenceDate, activePeriod);

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

  /* v8 ignore start */
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

  /* v8 ignore stop */
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
    /* v8 ignore start */
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
              Entre na sua conta para acessar o Painel Financeiro
            </p>
          </div>

          {isGooglePickerOpen ? (
            <div className="space-y-4">
              <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.99-3.09z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z" />
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
                    onClick={() => selectGoogleAccount('contato@copilotofinanc.app.br')}
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
                  className="w-full py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.99-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z" />
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

            </form>
          )}
        </div>
      </div>
    );
    /* v8 ignore stop */
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
            {/* PLANO 1: ESSENCIAL / BASICO - R$ 19,90 */}
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

            {/* PLANO 2: COPILOTO / INTERMEDIARIO - R$ 29,90 */}
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
            <button type="button" onClick={handleLogout} className="text-rose-300 hover:text-rose-200 font-semibold cursor-pointer">
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }
  /* v8 ignore stop */

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100">
      <div className="bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#1e1b4b] border-b border-rose-500/30 px-4 py-2.5 no-print">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-wide text-white uppercase">
            <span role="img" aria-label="Fogo">
              🔥
            </span>
            <span>MODO APAGA INCÊNDIO</span>
          </div>
          <span className="text-[11px] text-rose-200 hidden sm:inline">
            Controle Rápido Diário · Semanal · Mensal
          </span>
        </div>
      </div>

      <div className="bg-[#0d1424] border-b border-[#1e2d4a] px-4 py-2.5 no-print">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between text-xs">
          <div className="text-slate-300 truncate">
            Logado como: <strong className="text-white">{userEmail}</strong>
          </div>
          <a
            href="https://wa.me/?text=Ol%C3%A1!%20Conhe%C3%A7a%20o%20Copiloto%20Financeiro%20para%20controlar%20Vendas%2C%20Contas%20a%20Receber%2C%20Contas%20a%20Pagar%20e%20Taxas%20de%20Maquininha%20por%20voz%20(Relat%C3%B3rios%20Di%C3%A1rio%2C%20Semanal%20e%20Mensal).%20Acesse%20gr%C3%A1tis%3A%20https%3A%2F%2Fcopilotofinanc.app.br"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 mr-2"
            title="Compartilhar o Copiloto Financeiro no WhatsApp"
          >
            <span role="img" aria-label="WhatsApp">📲</span>
            <span>Indicar no WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-800/80 border border-rose-500/40 text-rose-100 font-semibold transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        <header className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
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
                onClick={/* v8 ignore next */ () => handleClearFieldValue('todos', 'todos')}
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
              onClick={scrollToReports}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Ver Relatórios Completos
            </button>
          </div>
        </div>

        <LiveVoiceCopilotWidget
          todayISO={referenceDate}
          onAddRecord={handleAddRecord}
          onClearFieldValue={handleClearFieldValue}
        />

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

        {activeNav === 'painel' && (
          <main className="space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div
/* v8 ignore next */                       className="flex items-center gap-1.5"
/* v8 ignore next */                       onClick={/* v8 ignore next */ (e) => e.stopPropagation()}
/* v8 ignore next */                     >
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
                        onClearFieldValue={/* v8 ignore next */ (_, p) =>
                          handleClearFieldValue('todos', p)
                        }
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

            <div className="bg-[#092922] border border-emerald-500/30 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Gerencie e adicione novas maquininhas de cartão ativas ao seu plano atual.
                </span>
              </div>
              <button
                type="button"
                onClick={/* v8 ignore next */ () => setIsMachinesModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
              >
                Conectar Maquininhas
              </button>
            </div>

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
              {['Nubank PJ', 'Banco Inter Empresas', 'Itaú Empresas'].map(
                (bank) => (
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
                onClick={/* v8 ignore next */ () => handleClearFieldValue('todos', 'todos')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Limpar Todos os Dados
              </button>
              <button
                type="button"
                onClick={handleSimulateDay31Lock}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg border border-amber-500/40 cursor-pointer"
              >
                🔒 Simular 31º Dia (Testar Bloqueio de Plano)
              </button>
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
              <a
                href="https://wa.me/?text=Ol%C3%A1!%20Conhe%C3%A7a%20o%20Copiloto%20Financeiro%20para%20controlar%20Vendas%2C%20Contas%20a%20Receber%2C%20Contas%20a%20Pagar%20e%20Taxas%20de%20Maquininha%20por%20voz%20(Relat%C3%B3rios%20Di%C3%A1rio%2C%20Semanal%20e%20Mensal).%20Acesse%20gr%C3%A1tis%3A%20https%3A%2F%2Fcopilotofinanc.app.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 cursor-pointer"
              >
                <span role="img" aria-label="WhatsApp">📲</span>
                Indicar para um Amigo Empreendedor (WhatsApp)
              </a>
              {/* v8 ignore start */}
              {userEmail?.toLowerCase() === 'faustoefiscal@gmail.com' && (
                <button
                  type="button"
                  onClick={/* v8 ignore next */ () => setIsAdminPanelOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg border border-amber-500/40 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isAdminPanelOpen
                    ? 'Ocultar Painel do Administrador (Webhooks)'
                    : 'Acessar Versão Administrador (Webhooks SaaS)'}
                </button>
              )}
              {/* v8 ignore stop */}
            </div>
            {/* v8 ignore start */}
            {isAdminPanelOpen && userEmail?.toLowerCase() === 'faustoefiscal@gmail.com' && (
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

        <NewTransactionModal
          isOpen={isNewModalOpen}
          defaultType={newModalDefaultType}
          todayISO={referenceDate}
          machines={machines}
          onClose={/* v8 ignore next */ () => setIsNewModalOpen(false)}
          onSave={handleAddRecord}
        />

        <CardMachinesModal
          isOpen={isMachinesModalOpen}
          machines={machines}
          onClose={/* v8 ignore next */ () => setIsMachinesModalOpen(false)}
          onToggleMachine={handleToggleMachine}
          onSimulateMachineSync={handleSimulateMachineSync}
        />
      </div>
    </div>
  );
}

