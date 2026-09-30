import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NewTransactionModal,
  CardMachinesModal,
  FeeCalculatorView,
  DailyClosingView,
  AccountantHubView,
} from './ModalsAndTools';
import { INITIAL_CARD_MACHINES } from '../utils/financeUtils';
import { FinancialRecord } from '../types/finance';

describe('ModalsAndTools - 100% Cobertura Total', () => {
  const todayISO = '2026-09-29';

  const sampleRecords: FinancialRecord[] = [
    {
      id: '1',
      type: 'vendas',
      title: 'Venda 1',
      entityName: 'Cliente 1',
      grossAmount: 500,
      feeAmount: 10,
      netAmount: 490,
      date: todayISO,
      time: '10:00',
      paymentMethod: 'pix',
      status: 'confirmado',
      subcategory: 'Balcão',
    },
    {
      id: '2',
      type: 'receber',
      title: 'Receber 1',
      entityName: 'Cliente 2',
      grossAmount: 300,
      feeAmount: 0,
      netAmount: 300,
      date: todayISO,
      time: '11:00',
      paymentMethod: 'boleto',
      status: 'pendente',
      subcategory: 'Boletos',
    },
    {
      id: '3',
      type: 'pagar',
      title: 'Pagar 1',
      entityName: 'Fornecedor 1',
      grossAmount: 200,
      feeAmount: 0,
      netAmount: 200,
      date: todayISO,
      time: '12:00',
      paymentMethod: 'boleto',
      status: 'confirmado',
      subcategory: 'Fornecedores',
    },
  ];

  beforeEach(() => {
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
    vi.restoreAllMocks();
  });

  it('1 - cobre 100% de NewTransactionModal (fechado, aberto, tipos, taxas, selects, limpar e salvar)', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    const disconnectedMachines = INITIAL_CARD_MACHINES.map((m) => ({
      ...m,
      connected: false,
    }));

    const { rerender } = render(
      <NewTransactionModal
        isOpen={false}
        defaultType="receber"
        todayISO={todayISO}
        machines={disconnectedMachines}
        onClose={onClose}
        onSave={onSave}
      />
    );

    rerender(
      <NewTransactionModal
        isOpen={true}
        defaultType="pagar"
        todayISO={todayISO}
        machines={INITIAL_CARD_MACHINES}
        onClose={onClose}
        onSave={onSave}
      />
    );
    rerender(
      <NewTransactionModal
        isOpen={true}
        defaultType="vendas"
        todayISO={todayISO}
        machines={INITIAL_CARD_MACHINES}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const form = screen
      .getByRole('button', { name: /Salvar Lançamento/i })
      .closest('form')!;
    fireEvent.submit(form);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'A Receber' }));
    fireEvent.click(screen.getByRole('button', { name: 'A Pagar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vendas' }));

    fireEvent.change(
      screen.getByPlaceholderText(/Ex: Venda Kit Produtos/i),
      { target: { value: 'Venda Cartão' } }
    );
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText('Data do Lançamento'), {
      target: { value: '2026-09-28' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Nome do cliente ou empresa'),
      { target: { value: 'Empresa X' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Ex: Maquininha, Fornecedores...'),
      { target: { value: 'Balcão' } }
    );

    fireEvent.change(screen.getByLabelText('Maquininha Utilizada'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Maquininha Utilizada'), {
      target: { value: INITIAL_CARD_MACHINES[0].id },
    });
    const pmSelect = screen.getByLabelText('Forma de Pagamento');
    fireEvent.change(pmSelect, { target: { value: 'debito' } });
    fireEvent.change(pmSelect, { target: { value: 'credito_vista' } });
    fireEvent.change(pmSelect, { target: { value: 'credito_parcelado' } });
    fireEvent.change(pmSelect, { target: { value: 'pix' } });
    fireEvent.change(pmSelect, { target: { value: 'dinheiro' } });

    fireEvent.change(screen.getByLabelText('Status / Situação'), {
      target: { value: 'pendente' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Limpar Campos/i }));

    fireEvent.change(
      screen.getByPlaceholderText(/Ex: Venda Kit Produtos/i),
      { target: { value: 'Venda Rápida' } }
    );
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '250' },
    });
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vendas',
        title: 'Venda Rápida',
        entityName: 'Cliente Balcão',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'A Receber' }));
    fireEvent.change(
      screen.getByPlaceholderText(/Ex: Parcela Cliente/i),
      { target: { value: 'Boleto 1' } }
    );
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '400' },
    });
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'receber',
        entityName: 'Cadastro Geral',
      })
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Ex: Parcela Cliente/i),
      { target: { value: 'Boleto 2' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Nome do cliente ou empresa'),
      { target: { value: 'Cliente VIP' } }
    );
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '500' },
    });
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        entityName: 'Cliente VIP',
      })
    );
  });

  it('2 - cobre 100% de CardMachinesModal, FeeCalculatorView, DailyClosingView e AccountantHubView', () => {
    const onClose = vi.fn();
    const onToggleMachine = vi.fn();
    const onSimulateMachineSync = vi.fn();

    const { rerender, unmount } = render(
      <CardMachinesModal
        isOpen={false}
        machines={INITIAL_CARD_MACHINES}
        onClose={onClose}
        onToggleMachine={onToggleMachine}
        onSimulateMachineSync={onSimulateMachineSync}
      />
    );
    rerender(
      <CardMachinesModal
        isOpen={true}
        machines={INITIAL_CARD_MACHINES}
        onClose={onClose}
        onToggleMachine={onToggleMachine}
        onSimulateMachineSync={onSimulateMachineSync}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Desconectar' })[0]);
    expect(onToggleMachine).toHaveBeenCalled();

    fireEvent.click(
      screen.getAllByRole('button', { name: /Importar Lote Hoje/i })[0]
    );
    expect(onSimulateMachineSync).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Concluído' }));
    expect(onClose).toHaveBeenCalled();
    unmount();

    const { unmount: unmountCalc } = render(
      <FeeCalculatorView machines={INITIAL_CARD_MACHINES} />
    );
    const inputs = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.change(inputs[0], { target: { value: '2000' } });
    fireEvent.change(inputs[1], { target: { value: '800' } });

    fireEvent.change(screen.getByLabelText('Maquininha de Cartão'), {
      target: { value: INITIAL_CARD_MACHINES[1].id },
    });

    fireEvent.click(screen.getByRole('button', { name: /Débito/i }));
    fireEvent.click(screen.getByRole('button', { name: /Créd\. 1x/i }));
    fireEvent.click(screen.getByRole('button', { name: /Parcelado/i }));
    unmountCalc();

    const { unmount: unmountClosing } = render(
      <DailyClosingView records={sampleRecords} referenceDate={todayISO} />
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Imprimir Fechamento do Dia/i })
    );
    expect(window.print).toHaveBeenCalled();
    unmountClosing();

    render(
      <AccountantHubView records={sampleRecords} referenceDate={todayISO} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lote Diário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lote Semanal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lote Mensal' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: /Baixar Relatório para Contador \(\.CSV\)/i,
      })
    );
  });
});
