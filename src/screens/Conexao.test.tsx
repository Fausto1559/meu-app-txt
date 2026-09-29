// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Conexao from './Conexao';

describe('Conexao - Cobertura de Integrações e APIs', () => {
  const mockProps = {
    plan: 'copiloto' as any,
    onNavigate: vi.fn(),
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    onDisconnectAll: vi.fn(),
    connectedMachines: [{ id: '1', nome: 'Stone' }, { id: '2', nome: 'Cielo' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lista as maquininhas disponíveis e conectadas', async () => {
    await act(async () => {
      render(<Conexao {...mockProps} />);
    });

    expect(screen.getByText('Conexão de Maquininhas')).toBeInTheDocument();
    expect(screen.getByText('Stone / Ton')).toBeInTheDocument();
    expect(screen.getByText('Desconectar Todas')).toBeInTheDocument();
  });

  it('exibe o aviso de bloqueio para o plano gratuito', async () => {
    await act(async () => {
      render(<Conexao {...mockProps} plan={'gratis' as any} connectedMachines={[]} />);
    });

    expect(
      screen.getByText(/disponível nos planos Copiloto e Copiloto Pro/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Desconectar Todas')).not.toBeInTheDocument();
  });

  it('conecta uma maquininha disponível', async () => {
    await act(async () => {
      render(<Conexao {...mockProps} connectedMachines={[]} />);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /conectar/i })[0]);

    expect(mockProps.onConnect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm-1' })
    );
  });

  it('desconecta uma maquininha conectada', async () => {
    await act(async () => {
      render(
        <Conexao
          {...mockProps}
          connectedMachines={[{ id: 'm-1', nome: 'Stone' } as any]}
        />
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /conectado/i }));

    expect(mockProps.onDisconnect).toHaveBeenCalledWith('m-1');
  });

  it('desconecta todas as maquininhas', async () => {
    await act(async () => {
      render(<Conexao {...mockProps} />);
    });

    fireEvent.click(screen.getByRole('button', { name: /desconectar todas/i }));

    expect(mockProps.onDisconnectAll).toHaveBeenCalledTimes(1);
  });
});
