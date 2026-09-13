// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoginScreen } from '../../screens/LoginScreen';
import * as firebaseAuth from 'firebase/auth';

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => ({})),
    signInWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
  };
});

describe('LoginScreen - Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('deve realizar login com sucesso ao preencher credenciais válidas', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: '123', email: 'fausto@teste.com' }
    } as any);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const senhaInput = screen.getByPlaceholderText('••••••••');
    const entrarButton = screen.getByRole('button', { name: /entrar com e-mail/i });

    fireEvent.change(emailInput, { target: { value: 'fausto@teste.com' } });
    fireEvent.change(senhaInput, { target: { value: 'senha123' } });
    fireEvent.click(entrarButton);

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'fausto@teste.com',
        'senha123'
      );
    });
  });

  it('deve exibir mensagem de erro ao falhar na autenticação', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(new Error('auth/invalid-credential'));

    render(<LoginScreen />);

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'errado@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar com e-mail/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao entrar com e-mail/i)).toBeInTheDocument();
    });
  });
});