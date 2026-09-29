// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SalesCalculator from './SalesCalculator';
import { saveUserRecord } from '../services/firestoreService';

const authState = vi.hoisted(() => ({ currentUser: null as any }));

vi.mock('../services/firebaseConfig', () => ({
  auth: {
    get currentUser() {
      return authState.currentUser;
    },
  },
}));

vi.mock('../services/firestoreService', () => ({
  saveUserRecord: vi.fn(),
}));

describe('SalesCalculator - Cobertura Integrada', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    authState.currentUser = null;
    vi.mocked(saveUserRecord).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('bloqueia o registro no plano gratuito', () => {
    render(<SalesCalculator plan={'gratis' as any} onSaleBooked={vi.fn()} />);

    expect(
      screen.getByText(/habilitado nos planos Copiloto e Copiloto Pro/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /registrar venda/i })
    ).not.toBeInTheDocument();
  });

  it('não registra quando o valor é zero ou vazio', () => {
    const onSaleBooked = vi.fn();
    render(<SalesCalculator plan={'copiloto' as any} onSaleBooked={onSaleBooked} />);

    fireEvent.click(screen.getByRole('button', { name: /registrar venda/i }));

    expect(onSaleBooked).not.toHaveBeenCalled();
    expect(saveUserRecord).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/Venda registrada com sucesso/i)
    ).not.toBeInTheDocument();
  });

  it('registra a venda, persiste no Firestore e exibe sucesso', async () => {
    vi.useFakeTimers();
    authState.currentUser = { uid: 'user-1' };
    vi.mocked(saveUserRecord).mockResolvedValue({ id: 'doc' } as any);
    const onSaleBooked = vi.fn();

    render(<SalesCalculator plan={'copiloto' as any} onSaleBooked={onSaleBooked} />);

    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '250,00' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar venda/i }));
    });

    expect(onSaleBooked).toHaveBeenCalledWith(250);
    expect(saveUserRecord).toHaveBeenCalledWith('user-1', 'sales', {
      amount: 250,
      timestamp: expect.any(String),
    });
    expect(
      screen.getByText(/Venda registrada com sucesso no caixa!/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0,00')).toHaveValue('');

    // O aviso de sucesso some após 3 segundos
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(
      screen.queryByText(/Venda registrada com sucesso/i)
    ).not.toBeInTheDocument();
  });

  it('segue o fluxo mesmo quando o Firestore falha', async () => {
    authState.currentUser = { uid: 'user-1' };
    vi.mocked(saveUserRecord).mockRejectedValue(new Error('Firestore offline'));
    const onSaleBooked = vi.fn();

    render(<SalesCalculator plan={'copiloto' as any} onSaleBooked={onSaleBooked} />);

    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '100' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar venda/i }));
    });

    expect(onSaleBooked).toHaveBeenCalledWith(100);
    expect(console.error).toHaveBeenCalledWith(
      'Erro ao persistir venda no Firestore:',
      expect.any(Error)
    );
    expect(
      screen.queryByText(/Venda registrada com sucesso/i)
    ).not.toBeInTheDocument();
  });

  it('registra sem persistir quando não há usuário autenticado', async () => {
    const onSaleBooked = vi.fn();
    render(<SalesCalculator plan={'copiloto' as any} onSaleBooked={onSaleBooked} />);

    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '75,50' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar venda/i }));
    });

    expect(onSaleBooked).toHaveBeenCalledWith(75.5);
    expect(saveUserRecord).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Venda registrada com sucesso/i)
    ).toBeInTheDocument();
  });
});
