// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
} from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth: any, callback: (u: any) => void) => {
    callback(null);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn().mockResolvedValue(null),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
  signOut: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/firebaseConfig', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

describe('LoginScreen - Cobertura de Testes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const preencherEEnviar = async () => {
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), {
      target: { value: 'fausto@teste.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar com e-mail/i }));
    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1)
    );
  };

  it('renderiza a tela de login com as opções de acesso', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Acesse sua conta para continuar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /entrar com o google/i })
    ).toBeInTheDocument();
  });

  it('mostra mensagem de credenciais inválidas', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });

    render(<LoginScreen />);
    await preencherEEnviar();

    expect(screen.getByText('E-mail ou senha inválidos.')).toBeInTheDocument();
  });

  it('mostra mensagem genérica para outros erros de e-mail', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
      new Error('fora do ar')
    );

    render(<LoginScreen />);
    await preencherEEnviar();

    expect(
      screen.getByText('Erro ao entrar com e-mail. Tente novamente.')
    ).toBeInTheDocument();
  });

  it('login com e-mail bem-sucedido não exibe erro', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'u1' },
    });

    render(<LoginScreen />);
    await preencherEEnviar();

    expect(screen.queryByText(/inválidos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tente novamente/i)).not.toBeInTheDocument();
  });

  it('login Google cancelado pelo usuário', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
    });

    render(<LoginScreen />);
    fireEvent.click(screen.getByRole('button', { name: /entrar com o google/i }));

    await waitFor(() =>
      expect(
        screen.getByText('O login com o Google foi cancelado.')
      ).toBeInTheDocument()
    );
  });

  it('login Google com erro genérico registra no console', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.mocked(signInWithPopup).mockRejectedValueOnce(new Error('rede caiu'));

    render(<LoginScreen />);
    fireEvent.click(screen.getByRole('button', { name: /entrar com o google/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Ocorreu um erro ao tentar entrar. Tente novamente.')
      ).toBeInTheDocument()
    );
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('trata falha do getRedirectResult na montagem', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.mocked(getRedirectResult).mockRejectedValueOnce(
      new Error('redirect falhou')
    );

    render(<LoginScreen />);

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'Erro redirect:',
        expect.any(Error)
      )
    );

    consoleError.mockRestore();
  });
});
