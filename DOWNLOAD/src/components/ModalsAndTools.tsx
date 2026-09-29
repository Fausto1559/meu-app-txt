import React, { useState } from 'react';
import {
  Calculator,
  FileCheck2,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  CardMachine,
  FinancialRecord,
  PaymentMethod,
  ReportPeriod,
  TransactionStatus,
  TransactionType,
} from '../types/finance';
import {
  computeFieldSummary,
  exportReportToCSV,
  FIELD_LABELS,
  filterRecordsByPeriod,
  formatBRL,
  formatShortDateBR,
  PAYMENT_METHOD_LABELS,
  PERIOD_LABELS,
} from '../utils/financeUtils';
import { VoiceClearInput } from './VoiceFieldControls';

interface NewTransactionModalProps {
  isOpen: boolean;
  defaultType: TransactionType;
  todayISO: string;
  machines: CardMachine[];
  onClose: () => void;
  onSave: (record: Omit<FinancialRecord, 'id'>) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  defaultType,
  todayISO,
  machines,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [entityName, setEntityName] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [date, setDate] = useState(todayISO);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>(
    defaultType === 'vendas' ? 'confirmado' : 'pendente'
  );
  const [machineId, setMachineId] = useState<string>(
    machines.find((m) => m.connected)?.id || ''
  );
  const [subcategory, setSubcategory] = useState('Venda Balcão');

  React.useEffect(() => {
    setType(defaultType);
    setStatus(defaultType === 'vendas' ? 'confirmado' : 'pendente');
    if (defaultType === 'vendas') setSubcategory('Maquininha Stone');
    if (defaultType === 'receber') setSubcategory('Clientes / Boletos');
    if (defaultType === 'pagar') setSubcategory('Fornecedores');
  }, [defaultType, isOpen]);

  if (!isOpen) return null;

  const numericGross = parseFloat(grossAmount.replace(',', '.')) || 0;
  const selectedMachine = machines.find((m) => m.id === machineId);

  let feeRate = 0;
  if (type === 'vendas' && selectedMachine) {
    if (paymentMethod === 'debito') feeRate = selectedMachine.debitRate;
    if (paymentMethod === 'credito_vista') feeRate = selectedMachine.creditSightRate;
    if (paymentMethod === 'credito_parcelado') feeRate = selectedMachine.creditInstallmentRate;
    if (paymentMethod === 'pix') feeRate = selectedMachine.pixRate;
  }

  const calculatedFee = Number(((numericGross * feeRate) / 100).toFixed(2));
  const calculatedNet = Number((numericGross - calculatedFee).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericGross <= 0) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onSave({
      type,
      title: title.trim(),
      entityName: entityName.trim() || (type === 'vendas' ? 'Cliente Balcão' : 'Cadastro Geral'),
      grossAmount: numericGross,
      feeAmount: calculatedFee,
      netAmount: calculatedNet,
      date,
      time,
      paymentMethod,
      status,
      machineId: type === 'vendas' ? machineId : undefined,
      subcategory,
    });
    setTitle('');
    setEntityName('');
    setGrossAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-[#111a2e] border border-[#243659] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Novo Lançamento Financeiro</h3>
            <p className="text-xs text-slate-400">
              Cada campo possui Microfone (Voz) e botão "X" para limpar o valor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Field Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Campo do Relatório
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['vendas', 'receber', 'pagar'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setStatus(t === 'vendas' ? 'confirmado' : 'pendente');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    type === t
                      ? t === 'vendas'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : t === 'receber'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-rose-500 text-white border-rose-400'
                      : 'bg-[#0b1120] text-slate-300 border-[#1e2d4a]'
                  }`}
                >
                  {FIELD_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <VoiceClearInput
              className="sm:col-span-2"
              label="Descrição do Lançamento *"
              required
              value={title}
              onChange={setTitle}
              placeholder={
                type === 'vendas'
                  ? 'Ex: Venda Kit Produtos #415'
                  : type === 'receber'
                  ? 'Ex: Parcela Cliente / Repasse Cartão'
                  : 'Ex: Fornecedor de Mercadorias / Conta de Luz'
              }
            />

            <VoiceClearInput
              label="Valor Bruto (R$) *"
              type="number"
              numericOnly
              required
              value={grossAmount}
              onChange={setGrossAmount}
              placeholder="0,00"
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <VoiceClearInput
              label="Cliente / Fornecedor / Origem"
              value={entityName}
              onChange={setEntityName}
              placeholder="Nome do cliente ou empresa"
            />

            <VoiceClearInput
              label="Categoria"
              value={subcategory}
              onChange={setSubcategory}
              placeholder="Ex: Maquininha, Fornecedores..."
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((pm) => (
                  <option key={pm} value={pm}>
                    {PAYMENT_METHOD_LABELS[pm]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Status / Situação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="confirmado">Confirmado / Pago</option>
                <option value="pendente">Pendente / A Vencer</option>
                <option value="agendado">Agendado</option>
                <option value="atrasado">Em Atraso</option>
              </select>
            </div>

            {type === 'vendas' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Maquininha Utilizada (Cálculo automático de taxa)
                </label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sem maquininha (Taxa R$ 0,00)</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.brand}) — Débito {m.debitRate}% | Créd. {m.creditSightRate}%
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Net Preview */}
          {numericGross > 0 && (
            <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg p-3 flex items-center justify-between text-xs font-mono-num">
              <span className="text-slate-400">
                Taxa estimada ({feeRate.toFixed(2)}%): {formatBRL(calculatedFee)}
              </span>
              <span className="font-bold text-emerald-400">
                Valor Líquido: {formatBRL(calculatedNet)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2d4a]">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setEntityName('');
                setGrossAmount('');
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Campos
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CardMachinesModalProps {
  isOpen: boolean;
  machines: CardMachine[];
  onClose: () => void;
  onToggleMachine: (id: string) => void;
  onSimulateMachineSync: (machine: CardMachine) => void;
}

export const CardMachinesModal: React.FC<CardMachinesModalProps> = ({
  isOpen,
  machines,
  onClose,
  onToggleMachine,
  onSimulateMachineSync,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-[#111a2e] border border-[#243659] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Gerenciar Maquininhas de Cartão Conectadas
            </h3>
            <p className="text-xs text-slate-400">
              As vendas das maquininhas ativas alimentam automaticamente os relatórios Diário,
              Semanal e Mensal de Vendas e A Receber.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {machines.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl border transition-colors space-y-3 ${
                m.connected
                  ? 'bg-[#0b1b1d] border-emerald-500/50'
                  : 'bg-[#0b1120] border-[#1e2d4a]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{m.name}</h4>
                  <p className="text-xs text-slate-400">
                    Operadora: {m.brand} · Repasse D+{m.settlementDays}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    m.connected ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {m.connected ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#111a2e] p-2.5 rounded-lg font-mono-num">
                <div>
                  <span className="text-slate-400 block">Débito</span>
                  <span className="text-slate-200 font-semibold">{m.debitRate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Créd. 1x</span>
                  <span className="text-slate-200 font-semibold">{m.creditSightRate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Parcelado</span>
                  <span className="text-slate-200 font-semibold">
                    {m.creditInstallmentRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onToggleMachine(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    m.connected
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {m.connected ? 'Desconectar' : 'Conectar Maquininha'}
                </button>

                {m.connected && (
                  <button
                    type="button"
                    onClick={() => onSimulateMachineSync(m)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Importar Lote Hoje
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#1e2d4a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- SECONDARY TOP-BAR VIEWS --- */
export const FeeCalculatorView: React.FC<{ machines: CardMachine[] }> = ({ machines }) => {
  const [saleAmount, setSaleAmount] = useState('1000');
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [modality, setModality] = useState<'debito' | 'credito_vista' | 'credito_parcelado'>(
    'credito_vista'
  );
  const [costAmount, setCostAmount] = useState('550');

  const val = parseFloat(saleAmount) || 0;
  const cost = parseFloat(costAmount) || 0;
  const machine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  const rate =
    modality === 'debito'
      ? machine.debitRate
      : modality === 'credito_vista'
      ? machine.creditSightRate
      : machine.creditInstallmentRate;

  const feeValue = (val * rate) / 100;
  const netValue = val - feeValue;
  const netProfit = netValue - cost;
  const marginPct = val > 0 ? (netProfit / val) * 100 : 0;

  return (
    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          Calculadora de Taxas de Maquininha e Margem Líquida
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Cada campo possui Microfone de voz e botão "X" para apagar o valor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <VoiceClearInput
            label="Valor da Venda (R$)"
            type="number"
            numericOnly
            value={saleAmount}
            onChange={setSaleAmount}
            placeholder="0,00"
          />
          <VoiceClearInput
            label="Custo do Produto / Serviço (R$)"
            type="number"
            numericOnly
            value={costAmount}
            onChange={setCostAmount}
            placeholder="0,00"
          />
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Maquininha de Cartão
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3.5 py-2.5 text-xs text-white"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.brand})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Modalidade da Transação
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'debito', label: `Débito (${machine.debitRate}%)` },
                { id: 'credito_vista', label: `Créd. 1x (${machine.creditSightRate}%)` },
                {
                  id: 'credito_parcelado',
                  label: `Parcelado (${machine.creditInstallmentRate}%)`,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setModality(
                      item.id as 'debito' | 'credito_vista' | 'credito_parcelado'
                    )
                  }
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                    modality === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#0b1120] text-slate-300 border-[#1e2d4a]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-5 flex flex-col justify-between space-y-4 font-mono-num">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-sans">Venda Bruta</span>
              <span className="text-white font-semibold">{formatBRL(val)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-sans">
                Taxa {machine.brand} ({rate}%)
              </span>
              <span className="text-rose-400 font-semibold">- {formatBRL(feeValue)}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-[#1e2d4a]">
              <span className="text-slate-300 font-sans font-semibold">
                Valor Líquido a Receber (D+{machine.settlementDays})
              </span>
              <span className="text-emerald-400 font-bold text-base">
                {formatBRL(netValue)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-sans">Custo da Mercadoria</span>
              <span className="text-slate-300">- {formatBRL(cost)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e2d4a] flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 font-sans block">
                Lucro Líquido Real
              </span>
              <span className="text-2xl font-bold text-amber-400">
                {formatBRL(netProfit)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-sans block">Margem Final</span>
              <span className="text-lg font-bold text-sky-400">
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DailyClosingView: React.FC<{
  records: FinancialRecord[];
  referenceDate: string;
}> = ({ records, referenceDate }) => {
  const vendasDia = computeFieldSummary(records, referenceDate, 'diario', 'vendas');
  const receberDia = computeFieldSummary(records, referenceDate, 'diario', 'receber');
  const pagarDia = computeFieldSummary(records, referenceDate, 'diario', 'pagar');

  return (
    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1e2d4a] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            Fechamento Diário de Caixa ({formatShortDateBR(referenceDate)})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conferência consolidada de Vendas, Recebimentos e Pagamentos realizados no dia.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer self-start"
        >
          <Printer className="w-4 h-4" />
          Imprimir Fechamento do Dia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-num">
        <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-400 font-sans">1. Vendas do Dia</span>
          <div className="text-xl font-bold text-amber-400">
            {formatBRL(vendasDia.totalGross)}
          </div>
          <div className="text-xs text-slate-400">
            Líquido: {formatBRL(vendasDia.totalNet)} ({vendasDia.count} vendas)
          </div>
        </div>
        <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-400 font-sans">2. Contas a Receber Hoje</span>
          <div className="text-xl font-bold text-emerald-400">
            {formatBRL(receberDia.totalGross)}
          </div>
          <div className="text-xs text-slate-400">
            Confirmado: {formatBRL(receberDia.completedAmount)} · Pendente:{' '}
            {formatBRL(receberDia.pendingAmount)}
          </div>
        </div>
        <div className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-400 font-sans">3. Contas a Pagar Hoje</span>
          <div className="text-xl font-bold text-rose-400">
            {formatBRL(pagarDia.totalGross)}
          </div>
          <div className="text-xs text-slate-400">
            Pago: {formatBRL(pagarDia.completedAmount)} · Em aberto:{' '}
            {formatBRL(pagarDia.pendingAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccountantHubView: React.FC<{
  records: FinancialRecord[];
  referenceDate: string;
}> = ({ records, referenceDate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('mensal');
  const filtered = filterRecordsByPeriod(records, referenceDate, selectedPeriod, 'todos');
  const vendas = computeFieldSummary(records, referenceDate, selectedPeriod, 'vendas');
  const receber = computeFieldSummary(records, referenceDate, selectedPeriod, 'receber');
  const pagar = computeFieldSummary(records, referenceDate, selectedPeriod, 'pagar');

  return (
    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e2d4a] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Central do Contador — Exportação Fiscal e Contábil
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gere lotes Diários, Semanais ou Mensais prontos para conciliação contábil e apuração
            Simples Nacional / MEI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['diario', 'semanal', 'mensal'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                selectedPeriod === p
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[#0b1120] text-slate-300 border border-[#1e2d4a]'
              }`}
            >
              Lote {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-num">
        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
          <span className="text-xs text-slate-400 font-sans">
            Faturamento Vendas ({PERIOD_LABELS[selectedPeriod]})
          </span>
          <div className="text-lg font-bold text-white mt-1">
            {formatBRL(vendas.totalGross)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Taxas MDR dedutíveis: {formatBRL(vendas.totalFees)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
          <span className="text-xs text-slate-400 font-sans">
            Créditos A Receber ({PERIOD_LABELS[selectedPeriod]})
          </span>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {formatBRL(receber.totalGross)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Liquidados: {formatBRL(receber.completedAmount)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e2d4a]">
          <span className="text-xs text-slate-400 font-sans">
            Despesas & A Pagar ({PERIOD_LABELS[selectedPeriod]})
          </span>
          <div className="text-lg font-bold text-rose-400 mt-1">
            {formatBRL(pagar.totalGross)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pagos no período: {formatBRL(pagar.completedAmount)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4">
        <div className="text-xs text-slate-300">
          Arquivo contábil com <strong>{filtered.length} lançamentos</strong> classificados em
          Vendas, A Receber e A Pagar.
        </div>
        <button
          type="button"
          onClick={() =>
            exportReportToCSV(
              filtered,
              selectedPeriod,
              'todos',
              `Lote-Contabil-${PERIOD_LABELS[selectedPeriod]}`
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Baixar Relatório para Contador (.CSV)
        </button>
      </div>
    </div>
  );
};
