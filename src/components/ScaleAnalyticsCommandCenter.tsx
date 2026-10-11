import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Crown,
  DollarSign,
  FileSpreadsheet,
  Flame,
  Globe,
  Mic,
  TrendingUp,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { ReportPeriod } from '../types/finance';
import { formatBRL, PERIOD_LABELS } from '../utils/financeUtils';

export interface AppUserTelemetryRecord {
  id: string;
  email: string;
  businessName: string;
  segment:
    | 'MEI'
    | 'Simples Nacional (ME)'
    | 'Autônomo / Liberal'
    | 'Escritório Contábil';
  cityState: string;
  planStatus:
    | 'trial_30d'
    | 'essencial_19_90'
    | 'intermediario_29_90'
    | 'pro_39_90'
    | 'trial_expirado';
  trialDay: number;
  monthlyMrrValue: number;
  signupDateISO: string;
  lastActiveDateISO: string;
  lastActiveTime: string;
  sessionsCount: number;
  voiceCommandsUsed: number;
  transactionsLogged: number;
  calculatorUses: number;
  watched15sDemo: boolean;
  acquisitionChannel:
    | 'Link Vídeo 15s (Facebook)'
    | 'Indicação WhatsApp'
    | 'Contador Parceiro'
    | 'Acesso Direto (copilotofinanc.app.br)'
    | 'Grupos Comércio Local';
  device: 'Android / Mobile' | 'iPhone / iOS' | 'Desktop / Windows';
  engagementHealth: 'campeao' | 'saudavel' | 'risco_churn';
}

export const STORAGE_KEY_SCALE_TELEMETRY = 'copiloto_scale_telemetry_users_v2';

const shiftDaysISO = (baseISO: string, deltaDays: number): string => {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export const generateInitialScaleTelemetry = (
  todayISO: string,
  currentUserEmail?: string | null,
  currentActivePlan?: string | null,
  currentDayOfUsage = 1,
  currentRecordsCount = 0
): AppUserTelemetryRecord[] => {
  const realUserEmail = (
    currentUserEmail || 'faustoefiscal@gmail.com'
  ).toLowerCase();
  const isPro39 = currentActivePlan?.includes('39,90');
  const isInter29 = currentActivePlan?.includes('29,90');
  const isEss19 = currentActivePlan?.includes('19,90');

  const seed: AppUserTelemetryRecord[] = [
    {
      id: 'usr_real_current',
      email: realUserEmail,
      businessName:
        realUserEmail === 'faustoefiscal@gmail.com'
          ? 'Fausto & Fiscal — Diretoria Executiva (Admin)'
          : `Empresa Conectada (${realUserEmail.split('@')[0]})`,
      segment: 'Simples Nacional (ME)',
      cityState: 'Valparaíso de Goiás / DF e Região',
      planStatus: isPro39
        ? 'pro_39_90'
        : isInter29
        ? 'intermediario_29_90'
        : isEss19
        ? 'essencial_19_90'
        : 'trial_30d',
      trialDay: currentDayOfUsage,
      monthlyMrrValue: isPro39 ? 39.9 : isInter29 ? 29.9 : isEss19 ? 19.9 : 0,
      signupDateISO: todayISO,
      lastActiveDateISO: todayISO,
      lastActiveTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sessionsCount: 14,
      voiceCommandsUsed: Math.max(8, currentRecordsCount * 2),
      transactionsLogged: Math.max(6, currentRecordsCount),
      calculatorUses: 5,
      watched15sDemo: true,
      acquisitionChannel: 'Acesso Direto (copilotofinanc.app.br)',
      device: 'Desktop / Windows',
      engagementHealth: 'campeao',
    },
    {
      id: 'usr_02',
      email: 'oficina.irmaos.silva@gmail.com',
      businessName: 'Auto Center Irmãos Silva',
      segment: 'Simples Nacional (ME)',
      cityState: 'Valparaíso de Goiás - GO',
      planStatus: 'pro_39_90',
      trialDay: 28,
      monthlyMrrValue: 39.9,
      signupDateISO: shiftDaysISO(todayISO, -18),
      lastActiveDateISO: todayISO,
      lastActiveTime: '09:42',
      sessionsCount: 39,
      voiceCommandsUsed: 64,
      transactionsLogged: 82,
      calculatorUses: 19,
      watched15sDemo: true,
      acquisitionChannel: 'Link Vídeo 15s (Facebook)',
      device: 'Android / Mobile',
      engagementHealth: 'campeao',
    },
    {
      id: 'usr_03',
      email: 'studiobeleza.camila@hotmail.com',
      businessName: 'Studio Camila Estética & Unhas',
      segment: 'MEI',
      cityState: 'Brasília - DF',
      planStatus: 'intermediario_29_90',
      trialDay: 30,
      monthlyMrrValue: 29.9,
      signupDateISO: shiftDaysISO(todayISO, -25),
      lastActiveDateISO: todayISO,
      lastActiveTime: '10:15',
      sessionsCount: 27,
      voiceCommandsUsed: 41,
      transactionsLogged: 53,
      calculatorUses: 31,
      watched15sDemo: true,
      acquisitionChannel: 'Indicação WhatsApp',
      device: 'iPhone / iOS',
      engagementHealth: 'campeao',
    },
    {
      id: 'usr_04',
      email: 'padaria.paodourado@empresa.com.br',
      businessName: 'Panificadora Pão Dourado',
      segment: 'Simples Nacional (ME)',
      cityState: 'Luziânia - GO',
      planStatus: 'pro_39_90',
      trialDay: 30,
      monthlyMrrValue: 39.9,
      signupDateISO: shiftDaysISO(todayISO, -21),
      lastActiveDateISO: todayISO,
      lastActiveTime: '08:50',
      sessionsCount: 45,
      voiceCommandsUsed: 78,
      transactionsLogged: 110,
      calculatorUses: 22,
      watched15sDemo: true,
      acquisitionChannel: 'Link Vídeo 15s (Facebook)',
      device: 'Android / Mobile',
      engagementHealth: 'campeao',
    },
    {
      id: 'usr_05',
      email: 'carlos.eletricista.mei@gmail.com',
      businessName: 'Carlos Instalações Elétricas MEI',
      segment: 'MEI',
      cityState: 'Cidade Ocidental - GO',
      planStatus: 'trial_30d',
      trialDay: 27,
      monthlyMrrValue: 0,
      signupDateISO: shiftDaysISO(todayISO, -2),
      lastActiveDateISO: todayISO,
      lastActiveTime: '11:04',
      sessionsCount: 9,
      voiceCommandsUsed: 18,
      transactionsLogged: 21,
      calculatorUses: 7,
      watched15sDemo: true,
      acquisitionChannel: 'Grupos Comércio Local',
      device: 'Android / Mobile',
      engagementHealth: 'saudavel',
    },
    {
      id: 'usr_06',
      email: 'contabilidade.lider.df@gmail.com',
      businessName: 'Líder Assessoria Contábil (14 Clientes)',
      segment: 'Escritório Contábil',
      cityState: 'Taguatinga - DF',
      planStatus: 'pro_39_90',
      trialDay: 19,
      monthlyMrrValue: 39.9,
      signupDateISO: shiftDaysISO(todayISO, -4),
      lastActiveDateISO: shiftDaysISO(todayISO, -1),
      lastActiveTime: '17:30',
      sessionsCount: 22,
      voiceCommandsUsed: 15,
      transactionsLogged: 94,
      calculatorUses: 12,
      watched15sDemo: true,
      acquisitionChannel: 'Contador Parceiro',
      device: 'Desktop / Windows',
      engagementHealth: 'campeao',
    },
    {
      id: 'usr_07',
      email: 'distribuidora.bebidas.gama@gmail.com',
      businessName: 'Depósito & Bebidas Express Gama',
      segment: 'Simples Nacional (ME)',
      cityState: 'Gama - DF',
      planStatus: 'trial_30d',
      trialDay: 29,
      monthlyMrrValue: 0,
      signupDateISO: shiftDaysISO(todayISO, -5),
      lastActiveDateISO: shiftDaysISO(todayISO, -3),
      lastActiveTime: '16:12',
      sessionsCount: 11,
      voiceCommandsUsed: 24,
      transactionsLogged: 29,
      calculatorUses: 9,
      watched15sDemo: true,
      acquisitionChannel: 'Link Vídeo 15s (Facebook)',
      device: 'Android / Mobile',
      engagementHealth: 'saudavel',
    },
    {
      id: 'usr_08',
      email: 'marmitaria.saborcaseiro@gmail.com',
      businessName: 'Restaurante & Marmitaria Sabor Caseiro',
      segment: 'MEI',
      cityState: 'Novo Gama - GO',
      planStatus: 'essencial_19_90',
      trialDay: 30,
      monthlyMrrValue: 19.9,
      signupDateISO: shiftDaysISO(todayISO, -14),
      lastActiveDateISO: shiftDaysISO(todayISO, -2),
      lastActiveTime: '14:05',
      sessionsCount: 31,
      voiceCommandsUsed: 52,
      transactionsLogged: 67,
      calculatorUses: 16,
      watched15sDemo: false,
      acquisitionChannel: 'Indicação WhatsApp',
      device: 'Android / Mobile',
      engagementHealth: 'saudavel',
    },
    {
      id: 'usr_09',
      email: 'dr.marcelo.odonto@clinica.com.br',
      businessName: 'Clínica Odonto Prime',
      segment: 'Autônomo / Liberal',
      cityState: 'Águas Claras - DF',
      planStatus: 'intermediario_29_90',
      trialDay: 30,
      monthlyMrrValue: 29.9,
      signupDateISO: shiftDaysISO(todayISO, -19),
      lastActiveDateISO: shiftDaysISO(todayISO, -4),
      lastActiveTime: '18:40',
      sessionsCount: 19,
      voiceCommandsUsed: 29,
      transactionsLogged: 38,
      calculatorUses: 25,
      watched15sDemo: true,
      acquisitionChannel: 'Acesso Direto (copilotofinanc.app.br)',
      device: 'iPhone / iOS',
      engagementHealth: 'saudavel',
    },
    {
      id: 'usr_10',
      email: 'loja.modafeminina.val@gmail.com',
      businessName: 'Boutique Bela Moda Valparaíso',
      segment: 'MEI',
      cityState: 'Valparaíso de Goiás - GO',
      planStatus: 'trial_30d',
      trialDay: 28,
      monthlyMrrValue: 0,
      signupDateISO: shiftDaysISO(todayISO, -12),
      lastActiveDateISO: shiftDaysISO(todayISO, -6),
      lastActiveTime: '13:20',
      sessionsCount: 4,
      voiceCommandsUsed: 2,
      transactionsLogged: 5,
      calculatorUses: 8,
      watched15sDemo: true,
      acquisitionChannel: 'Link Vídeo 15s (Facebook)',
      device: 'iPhone / iOS',
      engagementHealth: 'risco_churn',
    },
    {
      id: 'usr_11',
      email: 'serralheria.ferroforte@hotmail.com',
      businessName: 'Serralheria Ferro Forte',
      segment: 'MEI',
      cityState: 'Santa Maria - DF',
      planStatus: 'trial_expirado',
      trialDay: 31,
      monthlyMrrValue: 0,
      signupDateISO: shiftDaysISO(todayISO, -28),
      lastActiveDateISO: shiftDaysISO(todayISO, -10),
      lastActiveTime: '19:10',
      sessionsCount: 6,
      voiceCommandsUsed: 5,
      transactionsLogged: 9,
      calculatorUses: 3,
      watched15sDemo: false,
      acquisitionChannel: 'Grupos Comércio Local',
      device: 'Android / Mobile',
      engagementHealth: 'risco_churn',
    },
  ];

  return seed;
};

interface ScaleAnalyticsCommandCenterProps {
  todayISO: string;
  currentUserEmail?: string | null;
  currentActivePlan?: string | null;
  currentDayOfUsage?: number;
  currentRecordsCount?: number;
  onNotify?: (msg: string) => void;
}

const PLAN_BADGES: Record<
  AppUserTelemetryRecord['planStatus'],
  { label: string; colorClass: string }
> = {
  trial_30d: {
    label: 'Teste Grátis (30d)',
    colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  essencial_19_90: {
    label: 'Essencial R$ 19,90/mês',
    colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  intermediario_29_90: {
    label: 'Intermediário R$ 29,90/mês',
    colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  pro_39_90: {
    label: 'Copiloto PRO R$ 39,90/mês',
    colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  trial_expirado: {
    label: '31º Dia (Trava Paywall)',
    colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

export const ScaleAnalyticsCommandCenter: React.FC<
  ScaleAnalyticsCommandCenterProps
> = ({
  todayISO,
  currentUserEmail,
  currentActivePlan,
  currentDayOfUsage = 1,
  currentRecordsCount = 0,
  onNotify,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('diario');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [channelFilter, setChannelFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [users, setUsers] = useState<AppUserTelemetryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCALE_TELEMETRY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback to default seed
      }
    }
    return generateInitialScaleTelemetry(
      todayISO,
      currentUserEmail,
      currentActivePlan,
      currentDayOfUsage,
      currentRecordsCount
    );
  });

  // Sincroniza em tempo real o usuário logado atual com a base de telemetria
  useEffect(() => {
    const email = (currentUserEmail || 'faustoefiscal@gmail.com').toLowerCase();
    const isPro39 = currentActivePlan?.includes('39,90');
    const isInter29 = currentActivePlan?.includes('29,90');
    const isEss19 = currentActivePlan?.includes('19,90');

    setUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === email);
      let updated: AppUserTelemetryRecord[];
      if (exists) {
        updated = prev.map((u) =>
          u.email.toLowerCase() === email
            ? {
                ...u,
                lastActiveDateISO: todayISO,
                trialDay: currentDayOfUsage,
                transactionsLogged: Math.max(
                  u.transactionsLogged,
                  currentRecordsCount
                ),
                planStatus: isPro39
                  ? 'pro_39_90'
                  : isInter29
                  ? 'intermediario_29_90'
                  : isEss19
                  ? 'essencial_19_90'
                  : u.planStatus,
                monthlyMrrValue: isPro39
                  ? 39.9
                  : isInter29
                  ? 29.9
                  : isEss19
                  ? 19.9
                  : u.monthlyMrrValue,
              }
            : u
        );
      } else {
        const newEntry: AppUserTelemetryRecord = {
          id: `usr_${Date.now().toString().slice(-5)}`,
          email,
          businessName: `Empresa (${email.split('@')[0]})`,
          segment: 'MEI',
          cityState: 'Brasil',
          planStatus: isPro39
            ? 'pro_39_90'
            : isInter29
            ? 'intermediario_29_90'
            : isEss19
            ? 'essencial_19_90'
            : 'trial_30d',
          trialDay: currentDayOfUsage,
          monthlyMrrValue: isPro39
            ? 39.9
            : isInter29
            ? 29.9
            : isEss19
            ? 19.9
            : 0,
          signupDateISO: todayISO,
          lastActiveDateISO: todayISO,
          lastActiveTime: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sessionsCount: 1,
          voiceCommandsUsed: 2,
          transactionsLogged: currentRecordsCount,
          calculatorUses: 1,
          watched15sDemo: true,
          acquisitionChannel: 'Acesso Direto (copilotofinanc.app.br)',
          device: 'Android / Mobile',
          engagementHealth: 'saudavel',
        };
        updated = [newEntry, ...prev];
      }
      localStorage.setItem(
        STORAGE_KEY_SCALE_TELEMETRY,
        JSON.stringify(updated)
      );
      return updated;
    });
  }, [
    currentUserEmail,
    currentActivePlan,
    currentDayOfUsage,
    currentRecordsCount,
    todayISO,
  ]);

  // Filtra usuários ativos de acordo com o período selecionado: Diário (Hoje), Semanal (Últimos 7 dias), Mensal (Últimos 30 dias)
  const periodUsers = useMemo(() => {
    const minDateISO =
      period === 'diario'
        ? todayISO
        : period === 'semanal'
        ? shiftDaysISO(todayISO, -6)
        : shiftDaysISO(todayISO, -29);

    return users.filter((u) => u.lastActiveDateISO >= minDateISO);
  }, [users, period, todayISO]);

  // Filtra por busca, plano e canal
  const filteredUsers = useMemo(() => {
    return periodUsers.filter((u) => {
      if (statusFilter !== 'todos' && u.planStatus !== statusFilter) {
        return false;
      }
      if (channelFilter !== 'todos' && u.acquisitionChannel !== channelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          u.businessName.toLowerCase().includes(q) ||
          u.cityState.toLowerCase().includes(q) ||
          u.segment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [periodUsers, statusFilter, channelFilter, searchQuery]);

  // KPIs Vitais de Escala para o Período (Diário, Semanal ou Mensal)
  const kpis = useMemo(() => {
    const activeCount = periodUsers.length;
    const totalRegistered = users.length;
    const payingUsers = periodUsers.filter(
      (u) =>
        u.planStatus === 'essencial_19_90' ||
        u.planStatus === 'intermediario_29_90' ||
        u.planStatus === 'pro_39_90'
    );
    const mrrActive = payingUsers.reduce(
      (acc, u) => acc + u.monthlyMrrValue,
      0
    );
    const totalMrrGlobal = users.reduce((acc, u) => acc + u.monthlyMrrValue, 0);
    const arrProjected = totalMrrGlobal * 12;

    const totalVoiceCommands = periodUsers.reduce(
      (acc, u) => acc + u.voiceCommandsUsed,
      0
    );
    const totalTransactions = periodUsers.reduce(
      (acc, u) => acc + u.transactionsLogged,
      0
    );
    const totalDemoWatches = periodUsers.filter((u) => u.watched15sDemo).length;
    const conversionRate =
      totalRegistered > 0
        ? (
            (users.filter((u) => u.monthlyMrrValue > 0).length /
              totalRegistered) *
            100
          ).toFixed(1)
        : '0.0';

    // Radar 25º ao 30º dia (prestes a bater no Paywall do 31º dia)
    const hotLeadsDay25To30 = users.filter(
      (u) =>
        (u.planStatus === 'trial_30d' || u.planStatus === 'trial_expirado') &&
        u.trialDay >= 25
    );

    const churnRiskUsers = users.filter(
      (u) => u.engagementHealth === 'risco_churn'
    );

    return {
      activeCount,
      totalRegistered,
      payingCount: payingUsers.length,
      mrrActive,
      totalMrrGlobal,
      arrProjected,
      totalVoiceCommands,
      totalTransactions,
      totalDemoWatches,
      conversionRate,
      hotLeadsDay25To30,
      churnRiskUsers,
    };
  }, [periodUsers, users]);

  // Simular entrada de novo usuário vindo do link do vídeo ou WhatsApp para testar escala
  const handleSimulateNewOrganicUser = () => {
    const sampleCities = [
      'Valparaíso de Goiás - GO',
      'Brasília - DF',
      'Goiânia - GO',
      'Anápolis - GO',
      'Taguatinga - DF',
      'Uberlândia - MG',
    ];
    const sampleSegments: AppUserTelemetryRecord['segment'][] = [
      'MEI',
      'Simples Nacional (ME)',
      'Autônomo / Liberal',
      'Escritório Contábil',
    ];
    const sampleChannels: AppUserTelemetryRecord['acquisitionChannel'][] = [
      'Link Vídeo 15s (Facebook)',
      'Indicação WhatsApp',
      'Contador Parceiro',
      'Grupos Comércio Local',
    ];

    const idx = users.length + 1;
    const pickedChannel = sampleChannels[idx % sampleChannels.length];
    const pickedSegment = sampleSegments[idx % sampleSegments.length];
    const pickedCity = sampleCities[idx % sampleCities.length];

    const planChoices: {
      status: AppUserTelemetryRecord['planStatus'];
      mrr: number;
    }[] = [
      { status: 'trial_30d', mrr: 0 },
      { status: 'essencial_19_90', mrr: 19.9 },
      { status: 'intermediario_29_90', mrr: 29.9 },
      { status: 'pro_39_90', mrr: 39.9 },
    ];
    const chosenPlan = planChoices[idx % planChoices.length];

    const newUser: AppUserTelemetryRecord = {
      id: `usr_sim_${Date.now().toString().slice(-5)}`,
      email: `empreendedor${idx}@comercio.com.br`,
      businessName: `Comércio & Serviços #${idx} (${pickedSegment})`,
      segment: pickedSegment,
      cityState: pickedCity,
      planStatus: chosenPlan.status,
      trialDay: chosenPlan.mrr > 0 ? 30 : 27,
      monthlyMrrValue: chosenPlan.mrr,
      signupDateISO: todayISO,
      lastActiveDateISO: todayISO,
      lastActiveTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sessionsCount: 5,
      voiceCommandsUsed: 12,
      transactionsLogged: 16,
      calculatorUses: 4,
      watched15sDemo: true,
      acquisitionChannel: pickedChannel,
      device: idx % 2 === 0 ? 'Android / Mobile' : 'iPhone / iOS',
      engagementHealth: 'campeao',
    };

    const next = [newUser, ...users];
    setUsers(next);
    localStorage.setItem(STORAGE_KEY_SCALE_TELEMETRY, JSON.stringify(next));
    onNotify?.(
      `Novo usuário rastreado em copilotofinanc.app.br: ${newUser.email} (${PLAN_BADGES[newUser.planStatus].label})!`
    );
  };

  // Exportar Relatório de Uso e Escala (Diário, Semanal ou Mensal) em CSV/Excel
  const handleExportUsageCSV = () => {
    const headers = [
      'Periodo_Relatorio',
      'Email_Usuario',
      'Empresa_Negocio',
      'Segmento',
      'Cidade_UF',
      'Status_Plano',
      'Dia_Trial',
      'MRR_Mensal_BRL',
      'Data_Cadastro',
      'Ultimo_Acesso_Data',
      'Ultimo_Acesso_Hora',
      'Sessoes',
      'Comandos_Voz',
      'Lancamentos_Caixa',
      'Usos_Calculadora',
      'Assistiu_Video_15s',
      'Canal_Aquisicao',
      'Dispositivo',
      'Saude_Engajamento',
    ];

    const rows = filteredUsers.map((u) => [
      PERIOD_LABELS[period],
      u.email,
      `"${u.businessName.replace(/"/g, '""')}"`,
      u.segment,
      `"${u.cityState}"`,
      PLAN_BADGES[u.planStatus].label,
      u.trialDay,
      u.monthlyMrrValue.toFixed(2).replace('.', ','),
      u.signupDateISO,
      u.lastActiveDateISO,
      u.lastActiveTime,
      u.sessionsCount,
      u.voiceCommandsUsed,
      u.transactionsLogged,
      u.calculatorUses,
      u.watched15sDemo ? 'SIM' : 'NAO',
      `"${u.acquisitionChannel}"`,
      `"${u.device}"`,
      u.engagementHealth.toUpperCase(),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-escala-usuarios-${period}-${todayISO}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onNotify?.(
      `Relatório ${PERIOD_LABELS[period]} de Usuários & Escala (.CSV) exportado com sucesso!`
    );
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO EXECUTIVO DE MONITORAMENTO E ESCALA */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#13203c] to-[#0f172a] border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1e2d4a] pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                <Activity className="w-3.5 h-3.5" />
                Central de Inteligência &amp; Escala · copilotofinanc.app.br
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                ● Planos Oficiais: R$ 19,90 · R$ 29,90 · R$ 39,90
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white">
              Relatórios Diário, Semanal e Mensal de Quem Usa o App + Indicadores Vitais de Escala
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl">
              Monitore quem está acessando{' '}
              <strong className="text-amber-300">copilotofinanc.app.br</strong>,
              quantos comandos de voz e lançamentos cada empresa realiza, de qual
              canal vieram (Vídeo 15s, WhatsApp, Contador), quem está entre o 25º e
              30º dia grátis prestes a assinar (R$ 19,90 / R$ 29,90 / R$ 39,90) e a
              Receita Recorrente Mensal (MRR / ARR).
            </p>
          </div>

          {/* SELETOR DIÁRIO | SEMANAL | MENSAL DE USUÁRIOS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex items-center p-1 bg-[#090e1a] border border-amber-500/30 rounded-xl">
              {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => {
                const active = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Usuários · {PERIOD_LABELS[p]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleExportUsageCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Relatório {PERIOD_LABELS[period]} (.CSV)
            </button>

            <button
              type="button"
              onClick={handleSimulateNewOrganicUser}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#17233d] hover:bg-[#1f2f52] border border-[#2a406c] text-amber-300 font-bold text-xs transition-colors cursor-pointer"
              title="Simular chegada de novo usuário vindo de campanha para testar o painel"
            >
              <UserPlus className="w-4 h-4" />
              + Simular Novo Usuário
            </button>
          </div>
        </div>

        {/* 6 CARDS VITAIS DE ESCALA (SAAS METRICS: DAU/WAU/MAU, MRR, CONVERSÃO, VOZ, VÍDEO 15S, PAYWALL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Usuários Ativos no Período (DAU / WAU / MAU) */}
          <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-sky-400">
                {period === 'diario'
                  ? 'DAU · Ativos Hoje'
                  : period === 'semanal'
                  ? 'WAU · Ativos na Semana'
                  : 'MAU · Ativos no Mês'}
              </span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-num">
              {kpis.activeCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {kpis.totalRegistered} total
              </span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold">
              Relatório {PERIOD_LABELS[period]} de Acesso
            </div>
          </div>

          {/* Card 2: Receita Recorrente Mensal (MRR) & Anual (ARR) */}
          <div className="bg-[#0b1120] border border-emerald-500/30 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
                MRR (Receita Mensal)
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono-num">
              {formatBRL(kpis.totalMrrGlobal)}
            </div>
            <div className="text-[11px] text-slate-300">
              ARR Projetado:{' '}
              <strong className="text-white">
                {formatBRL(kpis.arrProjected)}/ano
              </strong>
            </div>
          </div>

          {/* Card 3: Taxa de Conversão Trial -> Pagante */}
          <div className="bg-[#0b1120] border border-amber-500/30 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">
                Conversão Assinantes
              </span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono-num">
              {kpis.conversionRate}%
            </div>
            <div className="text-[11px] text-slate-300">
              <strong className="text-white">{kpis.payingCount}</strong> pagantes
              ativos no período
            </div>
          </div>

          {/* Card 4: Uso do Microfone de Voz & Lançamentos */}
          <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-purple-300">
                Comandos de Voz ({PERIOD_LABELS[period]})
              </span>
              <Mic className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-num">
              {kpis.totalVoiceCommands}
            </div>
            <div className="text-[11px] text-purple-300">
              {kpis.totalTransactions} lançamentos no caixa
            </div>
          </div>

          {/* Card 5: Retenção do Vídeo de 15s */}
          <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-300">
                Viram o Vídeo 15s
              </span>
              <Video className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-num">
              {kpis.totalDemoWatches}{' '}
              <span className="text-xs font-normal text-slate-400">
                empresas
              </span>
            </div>
            <div className="text-[11px] text-amber-300">
              Principal motor de ativação
            </div>
          </div>

          {/* Card 6: Radar do 25º ao 31º Dia (Fechamento Imediato) */}
          <div className="bg-[#0b1120] border border-rose-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] text-rose-300">
                Radar 25º–31º Dia
              </span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-300 font-mono-num">
              {kpis.hotLeadsDay25To30.length}{' '}
              <span className="text-xs font-normal text-slate-300">
                contas
              </span>
            </div>
            <div className="text-[11px] text-rose-300 font-semibold">
              Prontas p/ R$ 19,90 · R$ 29,90 · R$ 39,90
            </div>
          </div>
        </div>
      </div>

      {/* 3 RELATÓRIOS VITAIS COMPLEMENTARES PARA ESCALAR O PROJETO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* VITAL 1: FUNIL DE ESCALA & CONVERSÃO (VISITANTE -> TRIAL -> VOZ -> ASSINANTE) */}
        <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Relatório Vital #1 · Funil de Crescimento
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Funil de Conversão ({PERIOD_LABELS[period]})
              </h3>
            </div>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                stage: '1. Acessaram o Vídeo 15s / Landing Page',
                count: kpis.activeCount * 3,
                pct: '100%',
                barWidth: 'w-full',
                color: 'bg-sky-500',
              },
              {
                stage: '2. Criaram Conta (30 Dias Grátis Liberados)',
                count: kpis.activeCount,
                pct: '33.3%',
                barWidth: 'w-4/5',
                color: 'bg-indigo-500',
              },
              {
                stage: '3. Usaram Microfone de Voz no 1º Dia (Ativados)',
                count: periodUsers.filter((u) => u.voiceCommandsUsed >= 5)
                  .length,
                pct: `${Math.round(
                  (periodUsers.filter((u) => u.voiceCommandsUsed >= 5).length /
                    Math.max(1, kpis.activeCount)) *
                    100
                )}% dos cadastros`,
                barWidth: 'w-3/5',
                color: 'bg-amber-500',
              },
              {
                stage: '4. Assinantes Pagantes (R$ 19,90 / R$ 29,90 / R$ 39,90)',
                count: kpis.payingCount,
                pct: `${kpis.conversionRate}% conversão real`,
                barWidth: 'w-2/5',
                color: 'bg-emerald-500',
              },
            ].map((item) => (
              <div
                key={item.stage}
                className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>{item.stage}</span>
                  <span className="text-white font-mono-num">{item.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} ${item.barWidth}`}
                  />
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  Taxa da etapa:{' '}
                  <strong className="text-slate-200">{item.pct}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VITAL 2: ORIGEM DE TRÁFEGO (QUAIS CANAIS MAIS TRAZEM CLIENTES) */}
        <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Relatório Vital #2 · Canais de Aquisição
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                De Onde Vêm os Usuários ({PERIOD_LABELS[period]})
              </h3>
            </div>
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            {(
              [
                'Link Vídeo 15s (Facebook)',
                'Indicação WhatsApp',
                'Contador Parceiro',
                'Acesso Direto (copilotofinanc.app.br)',
                'Grupos Comércio Local',
              ] as AppUserTelemetryRecord['acquisitionChannel'][]
            ).map((channel) => {
              const channelUsers = periodUsers.filter(
                (u) => u.acquisitionChannel === channel
              );
              const channelMrr = channelUsers.reduce(
                (acc, u) => acc + u.monthlyMrrValue,
                0
              );
              return (
                <div
                  key={channel}
                  className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-white">{channel}</div>
                    <div className="text-[11px] text-slate-400">
                      {channelUsers.length} empresa(s) ativa(s) no período
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-emerald-400 font-mono-num">
                      {formatBRL(channelMrr)}/mês
                    </div>
                    <div className="text-[10px] text-slate-400">
                      MRR gerado pelo canal
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VITAL 3: RADAR QUENTE DE CONVERSÃO (25º AO 31º DIA) + RISCO DE ABANDONO */}
        <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Relatório Vital #3 · Ação Comercial Imediata
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Radar Fim dos 30 Dias Grátis &amp; Retenção
              </h3>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="font-extrabold text-amber-300 flex items-center justify-between">
                <span>🔥 Prestes a Vencer o Teste (Dia 25 a 31)</span>
                <span>{kpis.hotLeadsDay25To30.length} contas</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Estes usuários já usaram o app no mês e estão a poucos dias da
                trava automática do 31º dia (Planos R$ 19,90 · R$ 29,90 · R$ 39,90):
              </p>
              <div className="space-y-1.5 pt-1">
                {kpis.hotLeadsDay25To30.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between bg-[#0b1120] px-2.5 py-1.5 rounded-lg border border-[#1e2d4a]"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-white">
                        {lead.businessName}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {lead.email}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] shrink-0">
                      Dia {lead.trialDay}/30
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="font-extrabold text-rose-300 flex items-center justify-between">
                <span>⚠️ Alerta Anti-Churn (Baixo Uso Recente)</span>
                <span>{kpis.churnRiskUsers.length} contas</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Usuários que fizeram menos de 5 comandos de voz na semana (enviar
                vídeo de 15s no WhatsApp para reativar):
              </p>
              {kpis.churnRiskUsers.slice(0, 2).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between bg-[#0b1120] px-2.5 py-1.5 rounded-lg border border-[#1e2d4a]"
                >
                  <span className="text-slate-200 font-semibold truncate">
                    {u.businessName} ({u.cityState})
                  </span>
                  <span className="text-[10px] text-amber-300 shrink-0">
                    Último: {u.lastActiveDateISO}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABELA NOMINAL DETALHADA: QUEM USA COPILOTOFINANC.APP.BR (DIÁRIO, SEMANAL E MENSAL) */}
      <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-[#1e2d4a] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Auditoria Nominal de Uso · Período {PERIOD_LABELS[period]}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Lista de Quem Usa o Copiloto Financeiro ({filteredUsers.length}{' '}
              empresas no filtro)
            </h2>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar e-mail, empresa ou cidade..."
              className="px-3 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
            />

            <select
              aria-label="Filtrar por Status do Plano"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-slate-200 text-xs"
            >
              <option value="todos">Todos os Planos</option>
              <option value="trial_30d">Teste Grátis (30 Dias)</option>
              <option value="essencial_19_90">Essencial (R$ 19,90/mês)</option>
              <option value="intermediario_29_90">
                Intermediário (R$ 29,90/mês)
              </option>
              <option value="pro_39_90">Copiloto PRO (R$ 39,90/mês)</option>
              <option value="trial_expirado">31º Dia (Trava Paywall)</option>
            </select>

            <select
              aria-label="Filtrar por Canal de Aquisição"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0b1120] border border-[#1e2d4a] text-slate-200 text-xs"
            >
              <option value="todos">Todos os Canais de Origem</option>
              <option value="Link Vídeo 15s (Facebook)">
                Link Vídeo 15s (Facebook)
              </option>
              <option value="Indicação WhatsApp">Indicação WhatsApp</option>
              <option value="Contador Parceiro">Contador Parceiro</option>
              <option value="Grupos Comércio Local">
                Grupos Comércio Local
              </option>
              <option value="Acesso Direto (copilotofinanc.app.br)">
                Acesso Direto
              </option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1e2d4a] text-[11px] uppercase tracking-wider text-slate-400 bg-[#0b1120]">
                <th className="py-3 px-3">Empresa / E-mail</th>
                <th className="py-3 px-3">Segmento &amp; Cidade</th>
                <th className="py-3 px-3">Plano &amp; Dia do Trial</th>
                <th className="py-3 px-3">Canal de Origem</th>
                <th className="py-3 px-3 text-center">Uso de Voz / Caixa</th>
                <th className="py-3 px-3 text-center">Último Acesso</th>
                <th className="py-3 px-3 text-right">MRR Mensal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {filteredUsers.map((u) => {
                const badge = PLAN_BADGES[u.planStatus] || PLAN_BADGES.trial_30d;
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-[#16223b]/60 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">
                        {u.businessName}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold">
                        {u.segment}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.cityState} · {u.device}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.colorClass}`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Dia <strong className="text-slate-200">{u.trialDay}</strong> de 30
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">
                        {u.acquisitionChannel}
                      </div>
                      <div className="text-[10px] text-amber-300">
                        {u.watched15sDemo
                          ? '🎬 Assistiu Vídeo 15s'
                          : 'Acesso sem vídeo'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-bold text-emerald-300 font-mono-num">
                        🎙️ {u.voiceCommandsUsed} vozes
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.transactionsLogged} lançamentos · {u.calculatorUses} calc
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-semibold text-white">
                        {u.lastActiveDateISO}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        às {u.lastActiveTime} ({u.sessionsCount} sessões)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <span
                        className={`font-extrabold text-sm ${
                          u.monthlyMrrValue > 0
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatBRL(u.monthlyMrrValue)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
