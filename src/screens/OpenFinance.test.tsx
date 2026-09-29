// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenFinance } from './OpenFinance';

describe('OpenFinance - Consentimento e Sincronização Bancária', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lista as 6 maquininhas desconectadas com as taxas', () => {
    render(<OpenFinance />);

    expect(screen.getByText('Open Finance & Conectar Maquininhas')).toBeInTheDocument();
    expect(screen.getAllByText('Desconectado')).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: /conectar via open finance/i })).toHaveLength(6);

    // O consentimento LGPD é ÚNICO: um só checkbox para toda a integração
    // (regressão: ele chegou a renderizar dentro de cada card, e marcar um
    // marcava todos)
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);

    expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText('1,38%')).toBeInTheDocument();
    expect(screen.getByText('4,10%')).toBeInTheDocument();
    expect(screen.queryByText(/Última Sincronização:/)).not.toBeInTheDocument();
  });

  it('mostra "Conectando...", conecta e registra a última sincronização', async () => {
    render(<OpenFinance />);

    const botoes = screen.getAllByRole('button', {
      name: /conectar via open finance/i,
    });

    fireEvent.click(botoes[0]);

    // Estado de carregando enquanto o setTimeout de 1s não terminou
    expect(screen.getByText('Conectando...')).toBeInTheDocument();
    expect(botoes[0]).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText('Conectado')).toHaveLength(1);
    expect(screen.getByText(/Última Sincronização:/)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /desconectar maquininha/i })
    ).toHaveLength(1);
  });

  it('desconecta e remove a última sincronização', async () => {
    render(<OpenFinance />);

    fireEvent.click(
      screen.getAllByRole('button', { name: /conectar via open finance/i })[2]
    );
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /desconectar maquininha/i })
    );
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText('Desconectado')).toHaveLength(6);
    expect(screen.queryByText(/Última Sincronização:/)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /conectar via open finance/i })
    ).toHaveLength(6);
  });

  it('permite marcar e desmarcar o consentimento LGPD', () => {
    render(<OpenFinance />);

    const checkbox = screen.getByLabelText(/autorizo a coleta/i);
    expect(checkbox).not.toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    // Nenhuma maquininha conectada sem interação
    expect(window.alert).not.toHaveBeenCalled();
  });
});
