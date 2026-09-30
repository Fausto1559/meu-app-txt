import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportsSection } from './ReportsSection';
import { FinancialRecord } from '../types/finance';

describe('ReportsSection - 100% Cobertura Total', () => {
  const win = window as unknown as Record<string, unknown>;
  let mockInstance: any;
  const todayISO = '2026-09-29';

  const sampleRecords: FinancialRecord[] = [
    {
      id: 'v1',
      type: 'vendas',
      title: 'Venda Cartão Parcelado',
      entityName: 'Cliente Ana',
      grossAmount: 600,
      feeAmount: 30,
      netAmount: 570,
      date: todayISO,
      time: '09:00',
      paymentMethod: 'credito_parcelado',
      status: 'confirmado',
      installments: 3,
      subcategory: 'Maquininha Stone',
    },
    {
      id: 'v2',
      type: 'vendas',
      title: 'Venda Anterior Maior',
      entityName: 'Cliente Ontem',
      grossAmount: 2000,
      feeAmount: 0,
      netAmount: 2000,
      date: '2026-09-28',
      time: '10:00',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Pix',
    },
    {
      id: 'r1',
      type: 'receber',
      title: 'Repasse Stone',
      entityName: 'Stone Pagamentos',
      grossAmount: 800,
      feeAmount: 0,
      netAmount: 800,
      date: todayISO,
      time: '11:00',
      paymentMethod: 'transferencia',
      status: 'pendente',
      subcategory: 'Repasse',
    },
    {
      id: 'p1',
      type: 'pagar',
      title: 'Conta Energia',
      entityName: 'Concessionária Luz',
      grossAmount: 1500,
      feeAmount: 0,
      netAmount: 1500,
      date: todayISO,
      time: '15:00',
      paymentMethod: 'boleto',
      status: 'atrasado',
      subcategory: 'Utilidades',
    },
  ];

  beforeEach(() => {
    mockInstance = {
      lang: '',
      interimResults: true,
      maxAlternatives: 0,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
    };
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
    vi.spyOn(window, 'print').mockImplementation(() => {});
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
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
    vi.restoreAllMocks();
  });

  it('1 - testa cabeçalho (CSV, Imprimir, Novo Lançamento), abas de período/campo, navegador de datas e matriz consolidada', () => {
    const onChangeReferenceDate = vi.fn();
    const onChangePeriod = vi.fn();
    const onChangeField = vi.fn();
    const onAddRecord = vi.fn();
    const onToggleStatus = vi.fn();
    const onDeleteRecord = vi.fn();
    const onClearFieldValue = vi.fn();
    const onOpenNewModal = vi.fn();

    const { rerender } = render(
      <ReportsSection
        records={sampleRecords}
        referenceDate="2026-09-28"
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="todos"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Exportar Planilha \(CSV\)/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Imprimir \/ Salvar PDF/i })
    );
    expect(window.print).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Novo Lançamento/i }));
    expect(onOpenNewModal).toHaveBeenCalledWith('vendas');

    fireEvent.click(screen.getByRole('button', { name: 'Semanal' }));
    expect(onChangePeriod).toHaveBeenCalledWith('semanal');
    fireEvent.click(screen.getByRole('button', { name: 'Mensal' }));
    expect(onChangePeriod).toHaveBeenCalledWith('mensal');
    fireEvent.click(screen.getByRole('button', { name: 'Diário' }));
    expect(onChangePeriod).toHaveBeenCalledWith('diario');

    fireEvent.click(screen.getByRole('button', { name: 'Todos (3)' }));
    expect(onChangeField).toHaveBeenCalledWith('todos');
    fireEvent.click(screen.getByRole('button', { name: 'Vendas' }));
    expect(onChangeField).toHaveBeenCalledWith('vendas');
    fireEvent.click(screen.getByRole('button', { name: 'A Receber' }));
    expect(onChangeField).toHaveBeenCalledWith('receber');
    fireEvent.click(screen.getByRole('button', { name: 'A Pagar' }));
    expect(onChangeField).toHaveBeenCalledWith('pagar');

    fireEvent.click(screen.getByTitle('Período Anterior'));
    fireEvent.change(screen.getByLabelText('Data de Referência'), {
      target: { value: '2026-09-25' },
    });
    fireEvent.click(screen.getByTitle('Próximo Período'));
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(onChangeReferenceDate).toHaveBeenLastCalledWith(todayISO);

    fireEvent.click(screen.getByTestId('matrix-card-vendas'));
    fireEvent.click(screen.getByTestId('matrix-row-vendas-semanal'));
    fireEvent.click(screen.getByTestId('matrix-card-receber'));
    fireEvent.click(screen.getByTestId('matrix-row-receber-mensal'));
    fireEvent.click(screen.getByTestId('matrix-card-pagar'));
    fireEvent.click(screen.getByTestId('matrix-row-pagar-diario'));

    rerender(
      <ReportsSection
        records={sampleRecords}
        referenceDate={todayISO}
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="vendas"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Novo Lançamento/i }));

    rerender(
      <ReportsSection
        records={sampleRecords}
        referenceDate={todayISO}
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="receber"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );

    rerender(
      <ReportsSection
        records={sampleRecords}
        referenceDate={todayISO}
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="pagar"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );
  });

  it('2 - testa busca por texto e voz, filtros de status e pagamento, ações da tabela e estados vazios', () => {
    win.SpeechRecognition = function () {
      return mockInstance;
    };

    const onChangeReferenceDate = vi.fn();
    const onChangePeriod = vi.fn();
    const onChangeField = vi.fn();
    const onAddRecord = vi.fn();
    const onToggleStatus = vi.fn();
    const onDeleteRecord = vi.fn();
    const onClearFieldValue = vi.fn();
    const onOpenNewModal = vi.fn();

    const { rerender } = render(
      <ReportsSection
        records={sampleRecords}
        referenceDate={todayISO}
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="todos"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );

    const toggleBtns = screen.getAllByTitle(
      /Clique para alternar entre Confirmado\/Pago e Pendente/i
    );
    fireEvent.click(toggleBtns[0]);
    expect(onToggleStatus).toHaveBeenCalledWith('p1');

    const deleteBtns = screen.getAllByTitle(/Apagar \/ Excluir este valor/i);
    fireEvent.click(deleteBtns[0]);
    expect(onDeleteRecord).toHaveBeenCalledWith('p1');

    const searchInput = screen.getByPlaceholderText(
      'Buscar por voz ou texto...'
    );
    fireEvent.change(searchInput, { target: { value: 'Stone Pagamentos' } });
    expect(screen.getByText('Repasse Stone')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Utilidades' } });
    expect(screen.getByText('Conta Energia')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Limpar busca (X)'));
    expect((searchInput as HTMLInputElement).value).toBe('');

    const voiceSearchBtn = screen.getByTitle('Buscar por voz');
    fireEvent.click(voiceSearchBtn);
    fireEvent.click(voiceSearchBtn);
    fireEvent.click(voiceSearchBtn);
    act(() => {
      mockInstance.onresult?.({
        results: [[{ transcript: 'inexistente' }]],
      });
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Adicionar Lançamento Agora/i })
    );
    expect(onOpenNewModal).toHaveBeenCalledWith('vendas');

    fireEvent.click(screen.getByTitle('Limpar busca (X)'));
    fireEvent.change(screen.getByLabelText('Filtrar por Status'), {
      target: { value: 'confirmado' },
    });
    fireEvent.change(screen.getByLabelText('Filtrar por Status'), {
      target: { value: 'todos' },
    });

    fireEvent.change(screen.getByLabelText('Filtrar por Forma de Pagamento'), {
      target: { value: 'boleto' },
    });
    fireEvent.change(screen.getByLabelText('Filtrar por Forma de Pagamento'), {
      target: { value: 'todos' },
    });

    rerender(
      <ReportsSection
        records={[]}
        referenceDate={todayISO}
        onChangeReferenceDate={onChangeReferenceDate}
        todayISO={todayISO}
        activePeriod="diario"
        onChangePeriod={onChangePeriod}
        activeField="pagar"
        onChangeField={onChangeField}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onOpenNewModal={onOpenNewModal}
      />
    );
    expect(
      screen.getByText('Nenhum lançamento neste período.')
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Adicionar Lançamento Agora/i })
    );
    expect(onOpenNewModal).toHaveBeenLastCalledWith('pagar');
  });
});

