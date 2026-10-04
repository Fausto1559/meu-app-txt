import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App, {
  STORAGE_KEY_AUTH,
  STORAGE_KEY_MACHINES,
  STORAGE_KEY_RECORDS,
} from './App';
import { INITIAL_CARD_MACHINES } from './utils/financeUtils';

describe('App.tsx - 100% Cobertura Total', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY_AUTH, 'faustoefiscal@gmail.com');
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:mock-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
  });

  it('1 - inicializa sem e com localStorage, alterna períodos, cards KPI, exportação CSV e fechamento do toast', () => {
    const { unmount } = render(<App />);

    expect(
      screen.getByRole('link', { name: /Copiloto Financeiro/i })
    ).toBeInTheDocument();

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

    fireEvent.click(screen.getByText('Vendas Hoje'));
    fireEvent.click(screen.getByText('A Receber Hoje'));
    fireEvent.click(screen.getByText('A Pagar Hoje'));
    fireEvent.click(screen.getByText('A Pagar Hoje'));

    const exportBtns = screen.getAllByRole('button', { name: /Exportar CSV/i });
    fireEvent.click(exportBtns[0]);
    expect(
      screen.getByText(/Relatório exportado para CSV com sucesso/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Fechar notificação/i })
    );

    unmount();

    localStorage.setItem(
      STORAGE_KEY_RECORDS,
      JSON.stringify([
        {
          id: 'saved-1',
          type: 'vendas',
          description: 'Item Salvo no Storage',
          grossAmount: 200,
          feeRate: 0,
          feeAmount: 0,
          netAmount: 200,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          paymentMethod: 'pix',
          status: 'confirmado',
        },
      ])
    );
    localStorage.setItem(
      STORAGE_KEY_MACHINES,
      JSON.stringify(INITIAL_CARD_MACHINES)
    );

    render(<App />);
    expect(
      screen.getAllByText('Item Salvo no Storage').length
    ).toBeGreaterThan(0);
  }, 30000);

  it('2 - zera todos os campos, carrega dados de exemplo, alterna status, exclui item e foca relatório', () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole('button', { name: /Zerar Todos os Valores/i })
    );
    expect(
      screen.getByText(/Valores de Todos os 3 Campos/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Carregar Dados de Exemplo/i })
    );
    expect(
      screen.getByText(/Dados de exemplo restaurados com sucesso/i)
    ).toBeInTheDocument();

    const statusBadges = screen.getAllByTitle(
      /Clique para alternar Confirmado\/Pendente/i
    );
    fireEvent.click(statusBadges[0]);
    fireEvent.click(statusBadges[0]);

    const deleteBtns = screen.getAllByTitle('Excluir lançamento');
    fireEvent.click(deleteBtns[0]);

    const verNoRelatorioBtns = screen.getAllByRole('button', {
      name: /Ver no relatório/i,
    });
    fireEvent.click(verNoRelatorioBtns[0]);
  }, 30000);

  it('3 - abre e fecha modais de Novo Lançamento e Maquininhas, desconecta maquininhas e simula lote', () => {
    render(<App />);

    const novoBtns = screen.getAllByRole('button', {
      name: /^Novo Lançamento$/i,
    });
    fireEvent.click(novoBtns[0]);

    fireEvent.change(
      screen.getByPlaceholderText(
        /Ex: Venda Balcão, Cliente João, Conta de Energia/i
      ),
      { target: { value: 'Venda via Modal App' } }
    );
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '150' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Lançamento/i }));

    fireEvent.click(novoBtns[0]);
    const closeBtns = screen.getAllByRole('button', { name: /Cancelar/i });
    fireEvent.click(closeBtns[0]);

    const maqBtns = screen.getAllByRole('button', { name: /Maquininhas/i });
    fireEvent.click(maqBtns[0]);

    const toggleConnectBtns = screen.getAllByRole('button', {
      name: /Conectada|Desconectada/i,
    });
    fireEvent.click(toggleConnectBtns[0]);
    fireEvent.click(toggleConnectBtns[1]);
    fireEvent.click(toggleConnectBtns[2]);

    const simulateBtns = screen.getAllByRole('button', {
      name: /Importar Lote Hoje/i,
    });
    fireEvent.click(simulateBtns[0]);

    fireEvent.click(toggleConnectBtns[0]);
    fireEvent.click(simulateBtns[0]);
  }, 30000);

  it('4 - navega por todas as abas secundárias, sincroniza Open Finance, Webhooks, restaura/limpa no Perfil e faz Logout', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Calculadora/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fechamento Diário/i }));
    fireEvent.click(screen.getByRole('button', { name: /Central Contador/i }));

    fireEvent.click(screen.getByRole('button', { name: /Open Finance/i }));
    const syncBtns = screen.getAllByRole('button', { name: 'Sincronizar' });
    fireEvent.click(syncBtns[0]);

    fireEvent.click(screen.getByRole('button', { name: /Webhooks/i }));

    fireEvent.click(screen.getByRole('link', { name: /Copiloto Financeiro/i }));
    fireEvent.click(screen.getByRole('button', { name: /Perfil/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Restaurar Dados de Demonstração/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Limpar Todos os Dados/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /Sair da Conta/i }));

    fireEvent.submit(
      screen.getByPlaceholderText(/Digite sua senha/i).closest('form')!
    );
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));

    fireEvent.change(
      screen.getByPlaceholderText(/Ex: faustoefiscal@gmail.com/i),
      { target: { value: 'faustoefiscal@gmail.com' } }
    );
    fireEvent.change(screen.getByPlaceholderText(/Digite sua senha/i), {
      target: { value: '123456' },
    });
    fireEvent.submit(
      screen.getByPlaceholderText(/Digite sua senha/i).closest('form')!
    );

    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Entrar com o Google/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /contato@copilotofinanc\.app\.br/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));
  }, 30000);
});