import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FieldCardsGrid } from './FieldCardsGrid';
import { FinancialRecord } from '../types/finance';

describe('FieldCardsGrid - 100% Cobertura Total', () => {
  const win = window as unknown as Record<string, unknown>;
  let mockInstance: any;
  const todayISO = '2026-09-29';

  const sampleRecords: FinancialRecord[] = [
    {
      id: 'r1',
      type: 'vendas',
      title: 'Venda Balcão 1',
      entityName: 'Cliente 1',
      grossAmount: 300,
      feeAmount: 5,
      netAmount: 295,
      date: todayISO,
      time: '10:00',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Balcão',
    },
    {
      id: 'r2',
      type: 'receber',
      title: 'Boleto Cliente 2',
      entityName: 'Cliente 2',
      grossAmount: 450,
      feeAmount: 0,
      netAmount: 450,
      date: todayISO,
      time: '11:00',
      paymentMethod: 'boleto',
      status: 'pendente',
      subcategory: 'Boletos',
    },
    {
      id: 'r3',
      type: 'pagar',
      title: 'Fornecedor Atrasado',
      entityName: 'Fornecedor X',
      grossAmount: 200,
      feeAmount: 0,
      netAmount: 200,
      date: todayISO,
      time: '12:00',
      paymentMethod: 'boleto',
      status: 'atrasado',
      subcategory: 'Fornecedores',
    },
    {
      id: 'r4',
      type: 'pagar',
      title: 'Fornecedor Pendente',
      entityName: 'Fornecedor Y',
      grossAmount: 100,
      feeAmount: 0,
      netAmount: 100,
      date: todayISO,
      time: '13:00',
      paymentMethod: 'pix',
      status: 'pendente',
      subcategory: 'Fornecedores',
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
  });

  afterEach(() => {
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
    vi.restoreAllMocks();
  });

  it('1 - renderiza os 3 painéis com lançamentos e quando zerado, alterna períodos, limpa valores, abre modal e foca relatório', () => {
    const onAddRecord = vi.fn();
    const onToggleStatus = vi.fn();
    const onDeleteRecord = vi.fn();
    const onClearFieldValue = vi.fn();
    const onFocusReport = vi.fn();
    const onOpenNewModal = vi.fn();

    const { rerender } = render(
      <FieldCardsGrid
        records={sampleRecords}
        referenceDate={todayISO}
        todayISO={todayISO}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onFocusReport={onFocusReport}
        onOpenNewModal={onOpenNewModal}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Semanal' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Mensal' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Diário' })[0]);

    fireEvent.click(
      screen.getByTitle('Apagar / Excluir valor de Campo: Vendas (Diário)')
    );
    expect(onClearFieldValue).toHaveBeenCalledWith('vendas', 'diario');

    fireEvent.click(
      screen.getByTitle('Zerar / Excluir valor Diário de Campo: Vendas')
    );
    expect(onClearFieldValue).toHaveBeenCalledTimes(2);

    fireEvent.click(
      screen.getByTitle('Adicionar manualmente em Campo: Vendas')
    );
    expect(onOpenNewModal).toHaveBeenCalledWith('vendas');

    fireEvent.click(screen.getByRole('button', { name: /Confirmado/i }));
    expect(onToggleStatus).toHaveBeenCalledWith('r1');

    fireEvent.click(screen.getAllByTitle(/Excluir este valor/i)[0]);
    expect(onDeleteRecord).toHaveBeenCalledWith('r1');

    fireEvent.click(
      screen.getAllByRole('button', { name: /Ver Relatório Diário Completo/i })[0]
    );
    expect(onFocusReport).toHaveBeenCalledWith('vendas', 'diario');

    rerender(
      <FieldCardsGrid
        records={[]}
        referenceDate={todayISO}
        todayISO={todayISO}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onFocusReport={onFocusReport}
        onOpenNewModal={onOpenNewModal}
      />
    );
    expect(
      screen.getAllByText(/Campo zerado \(R\$ 0,00\)/i).length
    ).toBeGreaterThan(0);
  });

  it('2 - envia comando digitado, limpa texto, fecha feedback e testa todos os ramos de voz', () => {
    const onAddRecord = vi.fn();
    const onToggleStatus = vi.fn();
    const onDeleteRecord = vi.fn();
    const onClearFieldValue = vi.fn();
    const onFocusReport = vi.fn();
    const onOpenNewModal = vi.fn();

    render(
      <FieldCardsGrid
        records={sampleRecords}
        referenceDate={todayISO}
        todayISO={todayISO}
        onAddRecord={onAddRecord}
        onToggleStatus={onToggleStatus}
        onDeleteRecord={onDeleteRecord}
        onClearFieldValue={onClearFieldValue}
        onFocusReport={onFocusReport}
        onOpenNewModal={onOpenNewModal}
      />
    );

    const topVoiceBtn = screen.getByTitle(
      'Falar valor por voz em Campo: Vendas'
    );
    fireEvent.click(topVoiceBtn);
    expect(
      screen.getByText(/Digite ou fale o comando abaixo/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Fechar mensagem do campo'));

    const input = screen.getByPlaceholderText(
      'Fale ou digite: "Venda 450 reais Pix"'
    );
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(onAddRecord).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'rascunho' } });
    fireEvent.click(screen.getByTitle('Apagar texto deste campo'));
    expect((input as HTMLInputElement).value).toBe('');

    fireEvent.change(input, { target: { value: 'Venda 450 reais Pix' } });
    fireEvent.submit(form);
    expect(onAddRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vendas', grossAmount: 450 })
    );

    win.webkitSpeechRecognition = function () {
      return mockInstance;
    };

    fireEvent.click(topVoiceBtn);
    fireEvent.click(topVoiceBtn);

    const inlineMicBtn = screen.getByTitle('Ditar por voz em Campo: Vendas');
    fireEvent.click(inlineMicBtn);

    act(() => {
      mockInstance.onresult?.({
        results: [[{ transcript: 'venda 600 reais' }]],
      });
    });
    expect(onAddRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vendas', grossAmount: 600 })
    );

    fireEvent.click(topVoiceBtn);
    act(() => {
      mockInstance.onresult?.({});
    });

    fireEvent.click(topVoiceBtn);
    act(() => {
      mockInstance.onerror?.();
    });
    expect(
      screen.getByText(/Microfone bloqueado no navegador/i)
    ).toBeInTheDocument();

    fireEvent.click(topVoiceBtn);
    act(() => {
      mockInstance.onend?.();
    });

    delete win.webkitSpeechRecognition;
    win.SpeechRecognition = function () {
      throw new Error('Erro de hardware');
    };
    fireEvent.click(topVoiceBtn);
  });
});
