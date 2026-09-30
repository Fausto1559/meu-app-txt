import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatBRL,
  toISODate,
  parseISODate,
  addDays,
  formatShortDateBR,
  formatDayMonthBR,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  stepReferenceDate,
  getPeriodRange,
  filterRecordsByPeriod,
  computeFieldSummary,
  buildPeriodBuckets,
  generateInitialSeedRecords,
  parsePortugueseVoiceCommand,
  exportReportToCSV,
} from './financeUtils';
import { FinancialRecord } from '../types/finance';

describe('financeUtils - 100% Cobertura Total', () => {
  const todayISO = '2026-09-29';

  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:mock'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1 - cobre 100% das funcoes de datas, periodos, resumos e buckets', () => {
    expect(formatBRL(0)).toContain('0,00');
    expect(formatBRL(1250.5)).toContain('1.250,50');

    expect(toISODate(parseISODate(todayISO))).toBe(todayISO);
    expect(parseISODate('2026-00-00').getFullYear()).toBe(2026);
    expect(addDays(todayISO, 1)).toBe('2026-09-30');
    expect(formatShortDateBR(todayISO)).toBe('29/09/2026');
    expect(formatDayMonthBR(todayISO)).toBe('29/09');

    expect(getStartOfWeek('2026-09-27')).toBe('2026-09-21');
    expect(getStartOfWeek('2026-09-29')).toBe('2026-09-28');
    expect(getEndOfWeek('2026-09-29')).toBe('2026-10-04');
    expect(getStartOfMonth(todayISO)).toBe('2026-09-01');
    expect(getEndOfMonth(todayISO)).toBe('2026-09-30');

    expect(stepReferenceDate(todayISO, 'diario', 1)).toBe('2026-09-30');
    expect(stepReferenceDate(todayISO, 'semanal', 1)).toBe('2026-10-06');
    expect(stepReferenceDate(todayISO, 'mensal', 1)).toBe('2026-10-29');

    expect(getPeriodRange(todayISO, 'diario').start).toBe(todayISO);
    expect(getPeriodRange(todayISO, 'semanal').start).toBe('2026-09-28');
    expect(getPeriodRange(todayISO, 'mensal').start).toBe('2026-09-01');

    const seeds = generateInitialSeedRecords(todayISO);

    expect(filterRecordsByPeriod(seeds, todayISO, 'mensal').length).toBeGreaterThan(0);
    expect(filterRecordsByPeriod(seeds, todayISO, 'mensal', 'todos').length).toBeGreaterThan(0);
    expect(filterRecordsByPeriod(seeds, todayISO, 'mensal', 'vendas').length).toBeGreaterThan(0);

    const recordsForSummary: FinancialRecord[] = [
      {
        id: 'a',
        type: 'vendas',
        title: 'Maior',
        entityName: 'C1',
        grossAmount: 500,
        feeAmount: 10,
        netAmount: 490,
        date: todayISO,
        time: '10:00',
        paymentMethod: 'pix',
        status: 'confirmado',
        subcategory: 'Cat1',
      },
      {
        id: 'b',
        type: 'vendas',
        title: 'Menor',
        entityName: 'C2',
        grossAmount: 200,
        feeAmount: 5,
        netAmount: 195,
        date: todayISO,
        time: '',
        paymentMethod: 'pix',
        status: 'pendente',
        subcategory: 'Cat1',
      },
    ];
    const sumNoPrev = computeFieldSummary(recordsForSummary, todayISO, 'diario', 'vendas');
    expect(sumNoPrev.growthPercent).toBe(100);
    expect(sumNoPrev.maxRecord?.id).toBe('a');

    const zeroRecord: FinancialRecord[] = [
      {
        ...recordsForSummary[0],
        grossAmount: 0,
        netAmount: 0,
      },
    ];
    expect(computeFieldSummary(zeroRecord, todayISO, 'diario', 'vendas').growthPercent).toBe(0);
    expect(computeFieldSummary([], todayISO, 'diario', 'vendas').averageTicket).toBe(0);
    expect(computeFieldSummary(seeds, todayISO, 'diario', 'vendas').previousPeriodTotal).toBeGreaterThan(0);

    expect(buildPeriodBuckets([...seeds, recordsForSummary[1]], todayISO, 'diario').length).toBe(4);
    expect(buildPeriodBuckets(seeds, todayISO, 'semanal').length).toBe(7);
    expect(buildPeriodBuckets(seeds, '2026-09-15', 'mensal').length).toBe(5);
    expect(buildPeriodBuckets(seeds, '2026-02-15', 'mensal').length).toBe(4);
  });

  it('2 - cobre 100% de parsePortugueseVoiceCommand (linhas 895, 901-928) e exportReportToCSV', () => {
    const semNumero = parsePortugueseVoiceCommand('lancamento avulso', 'vendas', todayISO);
    expect(semNumero.grossAmount).toBe(150);
    const comZero = parsePortugueseVoiceCommand('venda 0 reais', 'vendas', todayISO);
    expect(comZero.grossAmount).toBe(150);

    const parcelado = parsePortugueseVoiceCommand(
      'venda 1.200,50 em 3x parcelado ontem',
      'vendas',
      todayISO
    );
    expect(parcelado.paymentMethod).toBe('credito_parcelado');
    expect(parcelado.date).toBe('2026-09-28');

    const creditoVista = parsePortugueseVoiceCommand(
      'vendi 300 no credito amanha',
      'vendas',
      todayISO
    );
    expect(creditoVista.paymentMethod).toBe('credito_vista');
    expect(creditoVista.date).toBe('2026-09-30');

    const debito = parsePortugueseVoiceCommand('maquininha 200 no debito', 'vendas', todayISO);
    expect(debito.paymentMethod).toBe('debito');

    const recPago = parsePortugueseVoiceCommand('recebi 450 em dinheiro', 'vendas', todayISO);
    expect(recPago.type).toBe('receber');
    expect(recPago.paymentMethod).toBe('dinheiro');
    expect(recPago.status).toBe('confirmado');

    const recAtrasado = parsePortugueseVoiceCommand(
      'receber 800 ted vencido',
      'vendas',
      todayISO
    );
    expect(recAtrasado.type).toBe('receber');
    expect(recAtrasado.paymentMethod).toBe('transferencia');
    expect(recAtrasado.status).toBe('atrasado');

    const recPendente = parsePortugueseVoiceCommand('cliente deve 320 fiado', 'vendas', todayISO);
    expect(recPendente.type).toBe('receber');
    expect(recPendente.status).toBe('pendente');

    const pagarBoleto = parsePortugueseVoiceCommand(
      'pagar boleto fornecedor 600',
      'vendas',
      todayISO
    );
    expect(pagarBoleto.type).toBe('pagar');
    expect(pagarBoleto.paymentMethod).toBe('boleto');
    expect(pagarBoleto.status).toBe('pendente');

    const pagarAtrasado = parsePortugueseVoiceCommand(
      'conta de luz 250 atrasado',
      'vendas',
      todayISO
    );
    expect(pagarAtrasado.type).toBe('pagar');
    expect(pagarAtrasado.status).toBe('atrasado');

    const pagarPago = parsePortugueseVoiceCommand('aluguel 1500 pago', 'vendas', todayISO);
    expect(pagarPago.type).toBe('pagar');
    expect(pagarPago.status).toBe('confirmado');

    const pagarImposto = parsePortugueseVoiceCommand('imposto 310', 'vendas', todayISO);
    expect(pagarImposto.type).toBe('pagar');

    const seeds = generateInitialSeedRecords(todayISO);
    exportReportToCSV(seeds.slice(0, 2), 'diario', 'todos', 'Hoje');
    exportReportToCSV(seeds.slice(0, 2), 'diario', 'vendas', 'Hoje');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });
});
