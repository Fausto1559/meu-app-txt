import {
  CardMachine,
  FieldPeriodSummary,
  FinancialRecord,
  PaymentMethod,
  PeriodReportBucket,
  ReportPeriod,
  TransactionStatus,
  TransactionType,
} from '../types/finance';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  credito_vista: 'Crédito à Vista',
  credito_parcelado: 'Crédito Parcelado',
  debito: 'Cartão Débito',
  dinheiro: 'Dinheiro / Espécie',
  boleto: 'Boleto Bancário',
  transferencia: 'TED / Transferência',
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  confirmado: 'Confirmado / Pago',
  pendente: 'Pendente / A Vencer',
  atrasado: 'Em Atraso',
  agendado: 'Agendado',
};

export const FIELD_LABELS: Record<TransactionType, string> = {
  vendas: 'Vendas',
  receber: 'A Receber',
  pagar: 'A Pagar',
};

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDays(dateStr: string, delta: number): string {
  const d = parseISODate(dateStr);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function formatShortDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDayMonthBR(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export function getStartOfWeek(dateStr: string): string {
  const d = parseISODate(dateStr);
  const day = d.getDay(); // 0 = Sun, 1 = Mon
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function getEndOfWeek(dateStr: string): string {
  const start = getStartOfWeek(dateStr);
  return addDays(start, 6);
}

export function getStartOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}-01`;
}

export function getEndOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function stepReferenceDate(
  refDate: string,
  period: ReportPeriod,
  direction: -1 | 1
): string {
  if (period === 'diario') {
    return addDays(refDate, direction);
  }
  if (period === 'semanal') {
    return addDays(refDate, direction * 7);
  }
  const d = parseISODate(refDate);
  d.setMonth(d.getMonth() + direction);
  return toISODate(d);
}

export function getPeriodRange(
  refDate: string,
  period: ReportPeriod
): { start: string; end: string; label: string; previousStart: string; previousEnd: string } {
  if (period === 'diario') {
    const prev = addDays(refDate, -1);
    const d = parseISODate(refDate);
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formatted = formatShortDateBR(refDate);
    return {
      start: refDate,
      end: refDate,
      label: `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${formatted}`,
      previousStart: prev,
      previousEnd: prev,
    };
  }

  if (period === 'semanal') {
    const start = getStartOfWeek(refDate);
    const end = getEndOfWeek(refDate);
    const prevStart = addDays(start, -7);
    const prevEnd = addDays(end, -7);
    return {
      start,
      end,
      label: `Semana de ${formatDayMonthBR(start)} a ${formatShortDateBR(end)}`,
      previousStart: prevStart,
      previousEnd: prevEnd,
    };
  }

  const start = getStartOfMonth(refDate);
  const end = getEndOfMonth(refDate);
  const d = parseISODate(refDate);
  const monthName = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const prevMonthDate = new Date(d.getFullYear(), d.getMonth() - 1, 15, 12, 0, 0);
  const prevMonthISO = toISODate(prevMonthDate);
  return {
    start,
    end,
    label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    previousStart: getStartOfMonth(prevMonthISO),
    previousEnd: getEndOfMonth(prevMonthISO),
  };
}

export function filterRecordsByPeriod(
  records: FinancialRecord[],
  refDate: string,
  period: ReportPeriod,
  field?: TransactionType | 'todos'
): FinancialRecord[] {
  const { start, end } = getPeriodRange(refDate, period);
  return records
    .filter((r) => {
      const inDate = r.date >= start && r.date <= end;
      const inField = !field || field === 'todos' ? true : r.type === field;
      return inDate && inField;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });
}

export function computeFieldSummary(
  records: FinancialRecord[],
  refDate: string,
  period: ReportPeriod,
  field: TransactionType
): FieldPeriodSummary {
  const { start, end, previousStart, previousEnd } = getPeriodRange(refDate, period);

  const currentRecords = records.filter(
    (r) => r.type === field && r.date >= start && r.date <= end
  );
  const previousRecords = records.filter(
    (r) => r.type === field && r.date >= previousStart && r.date <= previousEnd
  );

  const totalGross = currentRecords.reduce((acc, r) => acc + r.grossAmount, 0);
  const totalNet = currentRecords.reduce((acc, r) => acc + r.netAmount, 0);
  const totalFees = currentRecords.reduce((acc, r) => acc + r.feeAmount, 0);

  const completedAmount = currentRecords
    .filter((r) => r.status === 'confirmado')
    .reduce((acc, r) => acc + r.grossAmount, 0);

  const pendingAmount = currentRecords
    .filter((r) => r.status === 'pendente' || r.status === 'agendado')
    .reduce((acc, r) => acc + r.grossAmount, 0);

  const overdueAmount = currentRecords
    .filter((r) => r.status === 'atrasado')
    .reduce((acc, r) => acc + r.grossAmount, 0);

  const count = currentRecords.length;
  const averageTicket = count > 0 ? totalGross / count : 0;

  let maxRecord: FinancialRecord | null = null;
  for (const r of currentRecords) {
    if (!maxRecord || r.grossAmount > maxRecord.grossAmount) {
      maxRecord = r;
    }
  }

  const previousPeriodTotal = previousRecords.reduce((acc, r) => acc + r.grossAmount, 0);
  const growthPercent =
    previousPeriodTotal > 0
      ? ((totalGross - previousPeriodTotal) / previousPeriodTotal) * 100
      : totalGross > 0
      ? 100
      : 0;

  const byPaymentMethod: Record<PaymentMethod, number> = {
    pix: 0,
    credito_vista: 0,
    credito_parcelado: 0,
    debito: 0,
    dinheiro: 0,
    boleto: 0,
    transferencia: 0,
  };

  const subcatMap = new Map<string, { amount: number; count: number }>();

  for (const r of currentRecords) {
    byPaymentMethod[r.paymentMethod] = (byPaymentMethod[r.paymentMethod] || 0) + r.grossAmount;
    const prev = subcatMap.get(r.subcategory) || { amount: 0, count: 0 };
    subcatMap.set(r.subcategory, {
      amount: prev.amount + r.grossAmount,
      count: prev.count + 1,
    });
  }

  const bySubcategory = Array.from(subcatMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: totalGross > 0 ? (data.amount / totalGross) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    field,
    period,
    totalGross,
    totalNet,
    totalFees,
    completedAmount,
    pendingAmount,
    overdueAmount,
    count,
    averageTicket,
    maxRecord,
    previousPeriodTotal,
    growthPercent,
    byPaymentMethod,
    bySubcategory,
  };
}

export function buildPeriodBuckets(
  records: FinancialRecord[],
  refDate: string,
  period: ReportPeriod
): PeriodReportBucket[] {
  if (period === 'diario') {
    // 4 turn buckets of the selected day: Manhã (06-12h), Tarde (12-18h), Noite (18-24h), Madrugada (00-06h)
    const dayRecords = records.filter((r) => r.date === refDate);
    const turns = [
      { key: 'manha', label: 'Manhã', sublabel: '06:00 – 11:59', minH: 6, maxH: 11 },
      { key: 'tarde', label: 'Tarde', sublabel: '12:00 – 17:59', minH: 12, maxH: 17 },
      { key: 'noite', label: 'Noite', sublabel: '18:00 – 23:59', minH: 18, maxH: 23 },
      { key: 'madrugada', label: 'Madrugada', sublabel: '00:00 – 05:59', minH: 0, maxH: 5 },
    ];

    return turns.map((t) => {
      const slice = dayRecords.filter((r) => {
        const h = parseInt((r.time || '12:00').split(':')[0], 10);
        return h >= t.minH && h <= t.maxH;
      });
      return aggregateSliceToBucket(t.label, t.sublabel, `${refDate}-${t.key}`, slice);
    });
  }

  if (period === 'semanal') {
    const start = getStartOfWeek(refDate);
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const buckets: PeriodReportBucket[] = [];
    for (let i = 0; i < 7; i++) {
      const dStr = addDays(start, i);
      const slice = records.filter((r) => r.date === dStr);
      buckets.push(
        aggregateSliceToBucket(dayNames[i], formatDayMonthBR(dStr), dStr, slice)
      );
    }
    return buckets;
  }

  // Mensal: 4-5 weekly blocks inside the month + daily resolution
  const start = getStartOfMonth(refDate);
  const end = getEndOfMonth(refDate);
  const [y, m] = refDate.split('-');
  const lastDayNum = parseInt(end.split('-')[2], 10);

  const weekRanges = [
    { label: 'Semana 1', startDay: 1, endDay: 7 },
    { label: 'Semana 2', startDay: 8, endDay: 14 },
    { label: 'Semana 3', startDay: 15, endDay: 21 },
    { label: 'Semana 4', startDay: 22, endDay: 28 },
  ];
  if (lastDayNum > 28) {
    weekRanges.push({ label: 'Semana 5', startDay: 29, endDay: lastDayNum });
  }

  return weekRanges.map((w) => {
    const sDate = `${y}-${m}-${String(w.startDay).padStart(2, '0')}`;
    const eDate = `${y}-${m}-${String(w.endDay).padStart(2, '0')}`;
    const slice = records.filter((r) => r.date >= sDate && r.date <= eDate);
    return aggregateSliceToBucket(
      w.label,
      `Dias ${String(w.startDay).padStart(2, '0')} a ${String(w.endDay).padStart(2, '0')}/${m}`,
      `${sDate}_${eDate}`,
      slice
    );
  });
}

function aggregateSliceToBucket(
  label: string,
  sublabel: string,
  dateKey: string,
  slice: FinancialRecord[]
): PeriodReportBucket {
  const vendas = slice.filter((r) => r.type === 'vendas');
  const receber = slice.filter((r) => r.type === 'receber');
  const pagar = slice.filter((r) => r.type === 'pagar');

  const vendasBruto = vendas.reduce((s, r) => s + r.grossAmount, 0);
  const vendasLiquido = vendas.reduce((s, r) => s + r.netAmount, 0);

  const receberTotal = receber.reduce((s, r) => s + r.grossAmount, 0);
  const receberRecebido = receber
    .filter((r) => r.status === 'confirmado')
    .reduce((s, r) => s + r.grossAmount, 0);
  const receberPendente = receber
    .filter((r) => r.status !== 'confirmado')
    .reduce((s, r) => s + r.grossAmount, 0);

  const pagarTotal = pagar.reduce((s, r) => s + r.grossAmount, 0);
  const pagarPago = pagar
    .filter((r) => r.status === 'confirmado')
    .reduce((s, r) => s + r.grossAmount, 0);
  const pagarAberto = pagar
    .filter((r) => r.status !== 'confirmado')
    .reduce((s, r) => s + r.grossAmount, 0);

  const saldoPrevisto = vendasLiquido + receberTotal - pagarTotal;

  return {
    label,
    sublabel,
    dateKey,
    vendasBruto,
    vendasLiquido,
    vendasCount: vendas.length,
    receberTotal,
    receberRecebido,
    receberPendente,
    receberCount: receber.length,
    pagarTotal,
    pagarPago,
    pagarAberto,
    pagarCount: pagar.length,
    saldoPrevisto,
  };
}

export const INITIAL_CARD_MACHINES: CardMachine[] = [
  {
    id: 'mac-stone',
    name: 'Stone Ton Pro',
    brand: 'Stone',
    debitRate: 1.39,
    creditSightRate: 3.09,
    creditInstallmentRate: 5.49,
    pixRate: 0.0,
    settlementDays: 1,
    connected: true,
    lastSync: 'Sincronizado há 5 min',
  },
  {
    id: 'mac-mp',
    name: 'Point Pro 2',
    brand: 'Mercado Pago',
    debitRate: 1.69,
    creditSightRate: 3.49,
    creditInstallmentRate: 6.29,
    pixRate: 0.0,
    settlementDays: 0,
    connected: true,
    lastSync: 'Sincronizado há 12 min',
  },
  {
    id: 'mac-pagbank',
    name: 'Moderninha Pro',
    brand: 'PagBank',
    debitRate: 1.99,
    creditSightRate: 3.79,
    creditInstallmentRate: 6.99,
    pixRate: 0.0,
    settlementDays: 1,
    connected: false,
    lastSync: 'Desconectada',
  },
  {
    id: 'mac-infinite',
    name: 'InfinitePay Smart',
    brand: 'InfinitePay',
    debitRate: 1.37,
    creditSightRate: 3.15,
    creditInstallmentRate: 5.39,
    pixRate: 0.0,
    settlementDays: 1,
    connected: false,
    lastSync: 'Desconectada',
  },
];

export function generateInitialSeedRecords(todayISO: string): FinancialRecord[] {
  const d0 = todayISO;
  const dMinus1 = addDays(todayISO, -1);
  const dMinus2 = addDays(todayISO, -2);
  const dMinus3 = addDays(todayISO, -3);
  const dMinus5 = addDays(todayISO, -5);
  const dMinus8 = addDays(todayISO, -8);
  const dMinus12 = addDays(todayISO, -12);
  const dMinus18 = addDays(todayISO, -18);
  const dPlus1 = addDays(todayISO, 1);
  const dPlus3 = addDays(todayISO, 3);
  const dPlus5 = addDays(todayISO, 5);

  const raw: Array<Omit<FinancialRecord, 'netAmount'>> = [
    // --- HOJE (DIÁRIO) ---
    {
      id: 'rec-101',
      type: 'vendas',
      title: 'Venda Balcão #408 — Kit Produtos Premium',
      entityName: 'Cliente Presencial (Stone)',
      grossAmount: 680.0,
      feeAmount: 21.01,
      date: d0,
      time: '09:25',
      paymentMethod: 'credito_vista',
      status: 'confirmado',
      machineId: 'mac-stone',
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-102',
      type: 'vendas',
      title: 'Venda Direta #409 — Pagamento Instantâneo',
      entityName: 'Mariana Costa',
      grossAmount: 420.0,
      feeAmount: 0,
      date: d0,
      time: '11:40',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Pix QR Code',
    },
    {
      id: 'rec-103',
      type: 'vendas',
      title: 'Venda #410 — Serviço + Mercadoria (3x)',
      entityName: 'Carlos Eduardo Rocha',
      grossAmount: 1250.0,
      feeAmount: 68.63,
      date: d0,
      time: '14:15',
      paymentMethod: 'credito_parcelado',
      status: 'confirmado',
      machineId: 'mac-stone',
      installments: 3,
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-104',
      type: 'vendas',
      title: 'Venda #411 — Atendimento Rápido',
      entityName: 'Balcão (Point Pro 2)',
      grossAmount: 290.0,
      feeAmount: 4.9,
      date: d0,
      time: '16:50',
      paymentMethod: 'debito',
      status: 'confirmado',
      machineId: 'mac-mp',
      subcategory: 'Mercado Pago Point',
    },
    {
      id: 'rec-201',
      type: 'receber',
      title: 'Repasse D+1 Maquininha Stone (Lote Cartão)',
      entityName: 'Stone Pagamentos S.A.',
      grossAmount: 1480.0,
      feeAmount: 45.73,
      date: d0,
      time: '08:30',
      paymentMethod: 'transferencia',
      status: 'pendente',
      machineId: 'mac-stone',
      subcategory: 'Repasse de Maquininha',
    },
    {
      id: 'rec-202',
      type: 'receber',
      title: 'Fatura Mensal — Pedido Corporativo #88',
      entityName: 'Clínica Vida & Saúde Ltda',
      grossAmount: 960.0,
      feeAmount: 0,
      date: d0,
      time: '15:00',
      paymentMethod: 'boleto',
      status: 'pendente',
      subcategory: 'Clientes / Boletos',
    },
    {
      id: 'rec-301',
      type: 'pagar',
      title: 'Reposição de Estoque — Lote Semanal',
      entityName: 'Distribuidora Nacional S.A.',
      grossAmount: 890.0,
      feeAmount: 0,
      date: d0,
      time: '10:00',
      paymentMethod: 'boleto',
      status: 'pendente',
      subcategory: 'Fornecedores',
    },
    {
      id: 'rec-302',
      type: 'pagar',
      title: 'Energia Elétrica Comercial + Internet Fibra',
      entityName: 'Concessionária Energia / Vivo Empresas',
      grossAmount: 465.0,
      feeAmount: 0,
      date: d0,
      time: '13:30',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Despesas Fixas',
    },

    // --- SEMANA ATUAL (OUTROS DIAS DA SEMANA) ---
    {
      id: 'rec-105',
      type: 'vendas',
      title: 'Fechamento de Turno — Vendas Cartão Débito',
      entityName: 'Lote Maquininha Stone',
      grossAmount: 1840.0,
      feeAmount: 25.58,
      date: dMinus1,
      time: '18:10',
      paymentMethod: 'debito',
      status: 'confirmado',
      machineId: 'mac-stone',
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-106',
      type: 'vendas',
      title: 'Vendas Pix Consolidado do Dia',
      entityName: 'Diversos Clientes (Pix)',
      grossAmount: 1120.0,
      feeAmount: 0,
      date: dMinus1,
      time: '19:00',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Pix QR Code',
    },
    {
      id: 'rec-203',
      type: 'receber',
      title: 'Parcela 2/3 — Contrato Manutenção',
      entityName: 'Oficina & Auto Peças Brasil',
      grossAmount: 1350.0,
      feeAmount: 0,
      date: dMinus1,
      time: '11:00',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Clientes / Contratos',
    },
    {
      id: 'rec-204',
      type: 'receber',
      title: 'Venda a Prazo — Nota Fiscal #312',
      entityName: 'Restaurante Sabor da Praça',
      grossAmount: 780.0,
      feeAmount: 0,
      date: dPlus1,
      time: '14:00',
      paymentMethod: 'boleto',
      status: 'pendente',
      subcategory: 'Clientes / Boletos',
    },
    {
      id: 'rec-303',
      type: 'pagar',
      title: 'Guia DAS / Simples Nacional',
      entityName: 'Receita Federal do Brasil',
      grossAmount: 542.8,
      feeAmount: 0,
      date: dMinus1,
      time: '16:00',
      paymentMethod: 'boleto',
      status: 'confirmado',
      subcategory: 'Impostos e Taxas',
    },
    {
      id: 'rec-107',
      type: 'vendas',
      title: 'Pedido Especial #398 — Crédito 4x',
      entityName: 'Fernanda Albuquerque',
      grossAmount: 2390.0,
      feeAmount: 131.21,
      date: dMinus2,
      time: '15:20',
      paymentMethod: 'credito_parcelado',
      status: 'confirmado',
      machineId: 'mac-stone',
      installments: 4,
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-304',
      type: 'pagar',
      title: 'Embalagens e Insumos Operacionais',
      entityName: 'Gráfica & Embalagens Express',
      grossAmount: 610.0,
      feeAmount: 0,
      date: dMinus2,
      time: '09:45',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Insumos / Operacional',
    },
    {
      id: 'rec-108',
      type: 'vendas',
      title: 'Vendas Balcão — Dinheiro e Pix',
      entityName: 'Movimento Caixa Diário',
      grossAmount: 1590.0,
      feeAmount: 0,
      date: dMinus3,
      time: '17:45',
      paymentMethod: 'dinheiro',
      status: 'confirmado',
      subcategory: 'Venda Balcão',
    },
    {
      id: 'rec-205',
      type: 'receber',
      title: 'Antecipação Programada Cartão de Crédito',
      entityName: 'Mercado Pago Instituição de Pagamento',
      grossAmount: 2150.0,
      feeAmount: 75.04,
      date: dPlus3,
      time: '10:00',
      paymentMethod: 'transferencia',
      status: 'agendado',
      machineId: 'mac-mp',
      subcategory: 'Repasse de Maquininha',
    },
    {
      id: 'rec-305',
      type: 'pagar',
      title: 'Frete e Logística de Entregas da Semana',
      entityName: 'Rápido Logística Ltda',
      grossAmount: 480.0,
      feeAmount: 0,
      date: dPlus1,
      time: '17:00',
      paymentMethod: 'pix',
      status: 'pendente',
      subcategory: 'Logística e Entregas',
    },

    // --- OUTRAS SEMANAS DO MÊS (PARA RELATÓRIO MENSAL COMPLETO) ---
    {
      id: 'rec-109',
      type: 'vendas',
      title: 'Lote Semanal Vendas Stone (Crédito/Débito)',
      entityName: 'Consolidado Maquininha Stone',
      grossAmount: 5480.0,
      feeAmount: 191.8,
      date: dMinus5,
      time: '18:30',
      paymentMethod: 'credito_vista',
      status: 'confirmado',
      machineId: 'mac-stone',
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-110',
      type: 'vendas',
      title: 'Fechamento de Vendas — Campanha Quinzena',
      entityName: 'Clientes Diversos (Pix + Cartão)',
      grossAmount: 6820.0,
      feeAmount: 142.5,
      date: dMinus8,
      time: '19:15',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Pix QR Code',
    },
    {
      id: 'rec-111',
      type: 'vendas',
      title: 'Vendas Corporativas sob Encomenda',
      entityName: 'Grupo Horizonte Comercial',
      grossAmount: 4950.0,
      feeAmount: 83.65,
      date: dMinus12,
      time: '14:40',
      paymentMethod: 'debito',
      status: 'confirmado',
      machineId: 'mac-mp',
      subcategory: 'Mercado Pago Point',
    },
    {
      id: 'rec-112',
      type: 'vendas',
      title: 'Vendas Primeira Semana do Mês',
      entityName: 'Movimento Loja Física',
      grossAmount: 5190.0,
      feeAmount: 160.37,
      date: dMinus18,
      time: '18:00',
      paymentMethod: 'credito_vista',
      status: 'confirmado',
      machineId: 'mac-stone',
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'rec-206',
      type: 'receber',
      title: 'Duplicata Mercantil #204 — Vencida',
      entityName: 'Comércio Silva & Filhos',
      grossAmount: 640.0,
      feeAmount: 0,
      date: dMinus5,
      time: '12:00',
      paymentMethod: 'boleto',
      status: 'atrasado',
      subcategory: 'Clientes / Boletos',
    },
    {
      id: 'rec-207',
      type: 'receber',
      title: 'Repasse Mensal Cartão Parcelado',
      entityName: 'Stone Pagamentos S.A.',
      grossAmount: 3890.0,
      feeAmount: 194.5,
      date: dMinus12,
      time: '09:00',
      paymentMethod: 'transferencia',
      status: 'confirmado',
      machineId: 'mac-stone',
      subcategory: 'Repasse de Maquininha',
    },
    {
      id: 'rec-306',
      type: 'pagar',
      title: 'Aluguel Comercial do Ponto + Condomínio',
      entityName: 'Imobiliária Central Patrimonial',
      grossAmount: 2850.0,
      feeAmount: 0,
      date: dMinus8,
      time: '10:30',
      paymentMethod: 'transferencia',
      status: 'confirmado',
      subcategory: 'Despesas Fixas',
    },
    {
      id: 'rec-307',
      type: 'pagar',
      title: 'Compra de Mercadorias — Atacado Matriz',
      entityName: 'Atacadão Suprimentos Brasil',
      grossAmount: 3420.0,
      feeAmount: 0,
      date: dMinus12,
      time: '11:15',
      paymentMethod: 'boleto',
      status: 'confirmado',
      subcategory: 'Fornecedores',
    },
    {
      id: 'rec-308',
      type: 'pagar',
      title: 'Honorários Contábeis + Folha / Pró-labore',
      entityName: 'Escritório Contábil Aliança',
      grossAmount: 2180.0,
      feeAmount: 0,
      date: dPlus5,
      time: '09:00',
      paymentMethod: 'pix',
      status: 'agendado',
      subcategory: 'Contabilidade e Equipe',
    },
  ];

  return raw.map((item) => ({
    ...item,
    netAmount: Number((item.grossAmount - item.feeAmount).toFixed(2)),
  }));
}

/**
 * Local Natural Language Parser for Portuguese voice or quick-text commands.
 * Never depends on external API quotas, avoiding resource_exhausted errors.
 */
export function parsePortugueseVoiceCommand(
  transcript: string,
  defaultType: TransactionType,
  todayISO: string
): Omit<FinancialRecord, 'id'> {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();

  // 1. Detect transaction type (vendas, receber, pagar)
  let type: TransactionType = defaultType;
  if (
    lower.includes('venda') ||
    lower.includes('vendi') ||
    lower.includes('maquininha')
  ) {
    type = 'vendas';
  } else if (
    lower.includes('receber') ||
    lower.includes('recebi') ||
    lower.includes('cliente deve') ||
    lower.includes('fiado')
  ) {
    type = 'receber';
  } else if (
    lower.includes('pagar') ||
    lower.includes('paguei') ||
    lower.includes('boleto') ||
    lower.includes('fornecedor') ||
    lower.includes('conta de') ||
    lower.includes('aluguel') ||
    lower.includes('imposto')
  ) {
    type = 'pagar';
  }

  // 2. Extract numeric amount (supports "1.250,50", "350,00", "480 reais", etc.)
  let grossAmount = 0;
  const amountRegex = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:[.,]\d{1,2})?)/gi;
  const matches = Array.from(lower.matchAll(amountRegex));
  if (matches.length > 0) {
    // Pick the largest plausible currency number or first currency number
    for (const m of matches) {
      const rawNum = m[1].replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(rawNum);
      if (parsed > grossAmount) {
        grossAmount = parsed;
      }
    }
  }
  if (grossAmount <= 0) {
    grossAmount = 150.0;
  }

  // 3. Detect payment method
  let paymentMethod: PaymentMethod = 'pix';
  if (lower.includes('parcelado') || /\b[2-9]x\b/.test(lower)) {
    paymentMethod = 'credito_parcelado';
  } else if (lower.includes('crédito') || lower.includes('credito') || lower.includes('cartão')) {
    paymentMethod = 'credito_vista';
  } else if (lower.includes('débito') || lower.includes('debito')) {
    paymentMethod = 'debito';
  } else if (lower.includes('boleto')) {
    paymentMethod = 'boleto';
  } else if (lower.includes('dinheiro') || lower.includes('espécie')) {
    paymentMethod = 'dinheiro';
  } else if (lower.includes('transferência') || lower.includes('ted')) {
    paymentMethod = 'transferencia';
  }

  // 4. Detect date ("ontem", "amanhã", or today)
  let date = todayISO;
  if (lower.includes('ontem')) {
    date = addDays(todayISO, -1);
  } else if (lower.includes('amanhã') || lower.includes('amanha')) {
    date = addDays(todayISO, 1);
  }

  // 5. Status
  let status: TransactionStatus = 'confirmado';
  if (type === 'receber' || type === 'pagar') {
    if (lower.includes('pago') || lower.includes('paguei') || lower.includes('recebi')) {
      status = 'confirmado';
    } else if (lower.includes('atrasado') || lower.includes('vencido')) {
      status = 'atrasado';
    } else {
      status = 'pendente';
    }
  }

  // 6. Fee calculation if card sale
  let feeAmount = 0;
  if (type === 'vendas') {
    if (paymentMethod === 'debito') feeAmount = Number((grossAmount * 0.0139).toFixed(2));
    if (paymentMethod === 'credito_vista') feeAmount = Number((grossAmount * 0.0309).toFixed(2));
    if (paymentMethod === 'credito_parcelado') feeAmount = Number((grossAmount * 0.0549).toFixed(2));
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const subcategory =
    type === 'vendas'
      ? paymentMethod === 'pix'
        ? 'Pix QR Code'
        : 'Maquininha Stone'
      : type === 'receber'
      ? 'Clientes / Boletos'
      : 'Fornecedores';

  return {
    type,
    title: clean.charAt(0).toUpperCase() + clean.slice(1),
    entityName:
      type === 'vendas'
        ? 'Venda Registrada por Voz'
        : type === 'receber'
        ? 'Cliente a Receber'
        : 'Conta / Fornecedor',
    grossAmount,
    feeAmount,
    netAmount: Number((grossAmount - feeAmount).toFixed(2)),
    date,
    time,
    paymentMethod,
    status,
    subcategory,
  };
}

export function exportReportToCSV(
  records: FinancialRecord[],
  period: ReportPeriod,
  field: TransactionType | 'todos',
  periodLabel: string
): void {
  const headers = [
    'Data',
    'Hora',
    'Campo',
    'Descrição',
    'Cliente / Origem / Fornecedor',
    'Categoria',
    'Forma de Pagamento',
    'Status',
    'Valor Bruto (R$)',
    'Taxa (R$)',
    'Valor Líquido (R$)',
  ];

  const rows = records.map((r) => [
    formatShortDateBR(r.date),
    r.time,
    FIELD_LABELS[r.type],
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.entityName.replace(/"/g, '""')}"`,
    `"${r.subcategory.replace(/"/g, '""')}"`,
    PAYMENT_METHOD_LABELS[r.paymentMethod],
    STATUS_LABELS[r.status],
    r.grossAmount.toFixed(2).replace('.', ','),
    r.feeAmount.toFixed(2).replace('.', ','),
    r.netAmount.toFixed(2).replace('.', ','),
  ]);

  const csvContent =
    '\uFEFF' +
    `Relatório Copiloto Financeiro - Período ${PERIOD_LABELS[period]} (${periodLabel})\n` +
    headers.join(';') +
    '\n' +
    rows.map((row) => row.join(';')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fieldSlug = field === 'todos' ? 'vendas-receber-pagar' : field;
  link.setAttribute('download', `relatorio-${period}-${fieldSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


