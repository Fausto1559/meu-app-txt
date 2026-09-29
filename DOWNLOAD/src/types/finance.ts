export type ReportPeriod = 'diario' | 'semanal' | 'mensal';

export type ReportField = 'todos' | 'vendas' | 'receber' | 'pagar';

export type TransactionType = 'vendas' | 'receber' | 'pagar';

export type PaymentMethod =
  | 'pix'
  | 'credito_vista'
  | 'credito_parcelado'
  | 'debito'
  | 'dinheiro'
  | 'boleto'
  | 'transferencia';

export type TransactionStatus = 'confirmado' | 'pendente' | 'atrasado' | 'agendado';

export interface FinancialRecord {
  id: string;
  type: TransactionType;
  title: string;
  entityName: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  machineId?: string;
  installments?: number;
  subcategory: string;
  notes?: string;
}

export interface CardMachine {
  id: string;
  name: string;
  brand: 'Stone' | 'Ton' | 'PagBank' | 'Mercado Pago' | 'InfinitePay' | 'Rede' | 'Cielo';
  debitRate: number;
  creditSightRate: number;
  creditInstallmentRate: number; // 2x-6x average
  pixRate: number;
  settlementDays: number; // e.g., 1 for D+1, 0 for D+0, 30 for D+30
  connected: boolean;
  lastSync: string;
}

export interface PeriodReportBucket {
  label: string;
  sublabel: string;
  dateKey: string;
  vendasBruto: number;
  vendasLiquido: number;
  vendasCount: number;
  receberTotal: number;
  receberRecebido: number;
  receberPendente: number;
  receberCount: number;
  pagarTotal: number;
  pagarPago: number;
  pagarAberto: number;
  pagarCount: number;
  saldoPrevisto: number;
}

export interface FieldPeriodSummary {
  field: TransactionType;
  period: ReportPeriod;
  totalGross: number;
  totalNet: number;
  totalFees: number;
  completedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  count: number;
  averageTicket: number;
  maxRecord: FinancialRecord | null;
  previousPeriodTotal: number;
  growthPercent: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  bySubcategory: Array<{ name: string; amount: number; count: number; percentage: number }>;
}
