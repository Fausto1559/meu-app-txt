// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FechamentoDiario } from './FechamentoDiario';
import { saveUserRecord } from '../services/firestoreService';

// Estado de autenticação controlado pelos testes
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

describe('FechamentoDiario - Fechamento de Caixa', () => {
  beforeEach(() => {
    // Espia o alert para evitar "Not implemented: Window's alert()" do jsdom
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.removeItem('copiloto_fechamentos');
    authState.currentUser = null;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('deve renderizar a tela de fechamento diário', () => {
    render(<FechamentoDiario />);

    expect(screen.getByText('Fechamento Diário')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /finalizar fechamento/i })
    ).toBeInTheDocument();
  });

  it('deve salvar localmente quando não há usuário autenticado', async () => {
    render(<FechamentoDiario />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /finalizar fechamento/i })
      );
    });

    // uid vazio quebraria a referência users/{uid}/fechamentos — o componente
    // evita o Firestore e aplica o fallback local.
    expect(window.alert).toHaveBeenCalledWith(
      'Usuário não autenticado. Salvando localmente...'
    );
    expect(saveUserRecord).not.toHaveBeenCalled();

    const salvos = JSON.parse(
      localStorage.getItem('copiloto_fechamentos') || '[]'
    );
    expect(salvos).toHaveLength(1);
    expect(salvos[0].saldoFinalEsperado).toBe(0);
  });

  it('deve salvar no Firestore quando há usuário autenticado', async () => {
    authState.currentUser = { uid: 'user-123' };
    vi.mocked(saveUserRecord).mockResolvedValue({ id: 'doc-1' } as any);

    render(<FechamentoDiario />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /finalizar fechamento/i })
      );
    });

    expect(saveUserRecord).toHaveBeenCalledWith(
      'user-123',
      'fechamentos',
      expect.objectContaining({
        saldoInicial: 0,
        entradasDinheiro: 0,
        saidas: 0,
        saldoFinalEsperado: 0,
      })
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Fechamento finalizado, salvo no Firestore e enviado para a Central do Contador!'
    );

    const salvos = JSON.parse(
      localStorage.getItem('copiloto_fechamentos') || '[]'
    );
    expect(salvos).toHaveLength(1);
  });

  it('deve aplicar o fallback local quando o Firestore falha', async () => {
    authState.currentUser = { uid: 'user-123' };
    vi.mocked(saveUserRecord).mockRejectedValue(new Error('Firestore offline'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<FechamentoDiario />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /finalizar fechamento/i })
      );
    });

    expect(consoleError).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Erro ao salvar no Firestore. Salvando localmente...'
    );

    const salvos = JSON.parse(
      localStorage.getItem('copiloto_fechamentos') || '[]'
    );
    expect(salvos).toHaveLength(1);

    consoleError.mockRestore();
  });

  it('calcula o saldo final esperado a partir dos valores digitados', () => {
    render(<FechamentoDiario />);

    const campos = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(campos[0], { target: { value: '100' } }); // Saldo Inicial
    fireEvent.change(campos[1], { target: { value: '50' } }); // Entradas
    fireEvent.change(campos[2], { target: { value: '30' } }); // Saídas

    expect(
      screen.getByText('Saldo Final Esperado: R$ 120,00')
    ).toBeInTheDocument();
  });
});
