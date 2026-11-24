import React from 'react';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSupabaseAuth } = vi.hoisted(() => {
  const session = { user: { id: 'test-user-id', email: 'faustoefiscal@gmail.com' } };
  let authListener: ((event: string, session: { user: { id: string; email: string } } | null) => void) | null = null;
  const auth = {
    onAuthStateChange: vi.fn((callback: (event: string, session: { user: { id: string; email: string } } | null) => void) => {
      authListener = callback;
      callback('INITIAL_SESSION', session);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    signInWithPassword: vi.fn(async () => {
      authListener?.('SIGNED_IN', session);
      return { data: { session }, error: null };
    }),
    signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
    signUp: vi.fn(async () => ({ data: { session }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: { user: session.user }, error: null })),
    signOut: vi.fn(async () => {
      authListener?.('SIGNED_OUT', null);
      return { error: null };
    }),
  };
  return { mockSupabaseAuth: auth };
});

vi.mock('./supabaseClient', () => ({ supabase: { auth: mockSupabaseAuth, from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })) })), upsert: vi.fn(async () => ({ error: null })) })) } }));

import App, { STORAGE_KEY_RECORDS, STORAGE_KEY_MACHINES, STORAGE_KEY_AUTH } from './App';

describe('App.tsx - 100% Cobertura Total', async () => {
  const waitForAppReady = async () => {
    await waitFor(() => {
      expect(screen.queryByText('Carregando seus dados financeiros com segurança...')).not.toBeInTheDocument();
    });
  };
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('copiloto_financeiro_auth_v1', 'faustoefiscal@gmail.com');
    localStorage.setItem('copiloto_financeiro_auth_v2', 'faustoefiscal@gmail.com');
    localStorage.setItem('copiloto_financeiro_auth_v3', 'faustoefiscal@gmail.com');
    localStorage.setItem(STORAGE_KEY_AUTH, 'faustoefiscal@gmail.com');
    vi.spyOn(window, 'open').mockImplementation(() => null);
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
    vi.useRealTimers();
  });

  it('1 - inicializa sem e com localStorage, alterna períodos, cards KPI, exportação CSV e fechamento do toast', async () => {
    
    const { unmount } = render(<App />);
    await waitForAppReady();
    expect(localStorage.getItem(STORAGE_KEY_RECORDS)).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY_MACHINES)).toBeTruthy();
    unmount();

    render(<App />);

    if (screen.queryByPlaceholderText(/Digite sua senha/i)) { fireEvent.submit(screen.getByPlaceholderText(/Digite sua senha/i).closest('form')!); }
    fireEvent.click(
      screen.getAllByRole('button', { name: /Relatório Semanal/i })[0]
    );
    expect(screen.getByText('Vendas Semana')).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: /Relatório Mensal/i })[0]
    );
    expect(screen.getByText('Vendas Mês')).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: /Relatório Diário/i })[0]
    );
    expect(screen.getByText('Vendas Hoje')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('kpi-card-vendas'));
    fireEvent.click(screen.getByTestId('kpi-card-receber'));
    fireEvent.click(screen.getByTestId('kpi-card-pagar'));
    fireEvent.click(screen.getByTestId('kpi-card-saldo'));
    fireEvent.click(
      screen.getByRole('button', { name: /Ver Relatórios Completos/i })
    );

    fireEvent.click(screen.getByRole('button', { name: /Exportar Diário/i }));

    fireEvent.click(screen.getByTitle('Apagar Vendas (Diário)'));
    fireEvent.click(screen.getByTitle('Fechar aviso'));

    vi.useFakeTimers();
    fireEvent.click(screen.getByTitle('Apagar A Receber (Diário)'));
    expect(screen.getByText('Atenção')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    vi.useRealTimers();

    fireEvent.click(screen.getByTitle('Apagar A Pagar (Diário)'));
    fireEvent.click(screen.getByRole('button', { name: /Desfazer Exclusão/i }));

    const saldoCard = screen.getByTestId('kpi-card-saldo');
    const clearSaldoBtn = within(saldoCard).getByTitle(
      /Apagar \/ Excluir valor de Vendas/i
    );
    fireEvent.click(clearSaldoBtn);
  }, 90000);

  it('2 - zera todos os campos, carrega dados de exemplo, alterna status, exclui item e foca relatório', async () => {
    render(<App />);

    const statusButtons = screen.getAllByRole('button', {
      name: /^Confirmado$/i,
    });
    fireEvent.click(statusButtons[0]);
    const pendenteButtons = screen.getAllByRole('button', {
      name: /^Pendente$/i,
    });
    fireEvent.click(pendenteButtons[0]);

    const deleteButtons = screen.getAllByTitle(/Excluir este valor/i);
    fireEvent.click(deleteButtons[0]);

    const focusBtns = screen.getAllByRole('button', {
      name: /Ver Relatório Diário Completo/i,
    });
    fireEvent.click(focusBtns[0]);

    fireEvent.click(
      screen.getByRole('button', { name: /Zerar Todos os Campos/i })
    );

    const loadExampleBtn = screen.getByRole('button', {
      name: /Carregar Dados de Exemplo/i,
    });
    fireEvent.click(loadExampleBtn);
  }, 90000);

  it('3 - abre e fecha modais de Novo Lançamento e Maquininhas, desconecta maquininhas e simula lote', async () => {
    render(<App />);

    fireEvent.click(
      screen.getAllByRole('button', { name: /Novo Lançamento/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    fireEvent.click(
      screen.getAllByRole('button', { name: /Novo Lançamento/i })[0]
    );
    const descInput = screen.getByPlaceholderText(/Ex: Venda Kit Produtos/i);
    fireEvent.change(descInput, { target: { value: 'Venda Teste App' } });
    const valInput = screen.getByPlaceholderText('0,00');
    fireEvent.change(valInput, { target: { value: '150' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Salvar Lançamento/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Conectar Maquininhas/i })
    );

    const disconnectBtns = screen.getAllByRole('button', {
      name: 'Desconectar',
    });
    fireEvent.click(disconnectBtns[0]);
    fireEvent.click(disconnectBtns[1]);
    expect(
      screen.getByText('Nenhuma maquininha conectada')
    ).toBeInTheDocument();

    const connectBtns = screen.getAllByRole('button', {
      name: 'Conectar Maquininha',
    });
    fireEvent.click(connectBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Concluído' }));

    fireEvent.click(
      screen.getByRole('button', { name: /Conectar Maquininhas/i })
    );
    const simulateBtns = screen.getAllByRole('button', {
      name: /Importar Lote Hoje/i,
    });
    fireEvent.click(screen.getByRole('button', { name: /Conclu/i }));
    fireEvent.click(screen.getByRole('button', { name: /Conectar Maquininhas/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Importar Lote Hoje/i })[0]);
  }, 90000);

  it('4 - navega por todas as abas secundárias, sincroniza Open Finance, restaura/limpa no Perfil e faz Logout', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Calculadora/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fechamento Diário/i }));
    fireEvent.click(screen.getByRole('button', { name: /Central Contador/i }));

    fireEvent.click(screen.getByRole('button', { name: /Open Finance/i }));
    const syncBtns = screen.getAllByRole('button', { name: 'Sincronizar' });
    fireEvent.click(syncBtns[0]);

    fireEvent.click(screen.getByRole('button', { name: /Perfil/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Restaurar Dados de Demonstração/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Limpar Todos os Dados/i })
    );
    fireEvent.click(screen.getByRole('link', { name: /Copiloto Financeiro/i }));
    fireEvent.click(screen.getByRole('button', { name: /Perfil/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sair da Conta/i }));
    fireEvent.change(screen.getByPlaceholderText(/Ex: voce@empresa.com.br/i), { target: { value: 'faustoefiscal@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Digite sua senha/i), { target: { value: '123456' } });
    fireEvent.submit(screen.getByPlaceholderText(/Digite sua senha/i).closest('form')!);
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));
  }, 90000);
});
