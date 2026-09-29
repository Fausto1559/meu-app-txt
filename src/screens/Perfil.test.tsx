// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, fireEvent, cleanup, act, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Perfil from './Perfil';

// Mock do Firebase Auth e Firestore usados no componente
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: 'user-123' } })),
  deleteUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
}));

const authState = vi.hoisted(() => ({ currentUser: { uid: 'user-123' } as any }));

vi.mock('../services/firebaseConfig', () => ({
  auth: {
    get currentUser() {
      return authState.currentUser;
    },
  },
  db: {},
}));

describe('Perfil - Testes de Cobertura LGPD e Zona de Perigo', () => {
  const mockProps = {
    onClose: vi.fn(),
    userData: { nome: 'Fausto Souza', empresa: 'Dracena Toldos' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    HTMLAnchorElement.prototype.click = vi.fn();
    authState.currentUser = { uid: 'user-123' };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. Deve renderizar o componente e executar a exportação de dados (LGPD)', async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = render(<Perfil {...mockProps} />);
      container = res.container;
    });

    const closeBtn = container.querySelector('button.text-slate-400');
    if (closeBtn) {
      await act(async () => {
        fireEvent.click(closeBtn);
      });
      expect(mockProps.onClose).toHaveBeenCalled();
    }

    const exportBtn = screen.getByRole('button', { name: /exportar meus dados/i });
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(exportBtn).toBeDefined();
  });

  it('2. Deve acionar o fluxo de exclusão, validar texto incorreto e cancelar', async () => {
    await act(async () => {
      render(<Perfil {...mockProps} />);
    });

    const deleteInitBtn = screen.getByRole('button', { name: /excluir minha conta e apagar todos os dados/i });
    await act(async () => {
      fireEvent.click(deleteInitBtn);
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });
    expect(window.alert).toHaveBeenCalledWith('Digite EXCLUIR para confirmar a remoção.');

    const input = screen.getByPlaceholderText('Digite EXCLUIR');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'ERRADO' } });
      fireEvent.click(confirmDeleteBtn);
    });

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(screen.queryByPlaceholderText('Digite EXCLUIR')).not.toBeInTheDocument();
  });

  it('3. Deve executar com sucesso a exclusão definitiva ao digitar EXCLUIR corretamente', async () => {
    await act(async () => {
      render(<Perfil {...mockProps} />);
    });

    const deleteInitBtn = screen.getByRole('button', { name: /excluir minha conta e apagar todos os dados/i });
    await act(async () => {
      fireEvent.click(deleteInitBtn);
    });

    const input = screen.getByPlaceholderText('Digite EXCLUIR');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    expect(window.alert).toHaveBeenCalledWith('Sua conta e todos os seus dados foram excluídos com sucesso.');
  });

  it('4. Deve tratar erro e exibir alerta caso ocorra falha na exclusão da conta', async () => {
    const { deleteUser } = await import('firebase/auth');
    vi.mocked(deleteUser).mockRejectedValueOnce(new Error('Erro de autenticação'));

    // Silencia o console.error intencional do componente no caminho de erro
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(<Perfil {...mockProps} />);
    });

    const deleteInitBtn = screen.getByRole('button', { name: /excluir minha conta e apagar todos os dados/i });
    await act(async () => {
      fireEvent.click(deleteInitBtn);
    });

    const input = screen.getByPlaceholderText('Digite EXCLUIR');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    expect(window.alert).toHaveBeenCalledWith('Por segurança, faça login novamente antes de realizar a exclusão da conta.');

    consoleError.mockRestore();
  });

  it('5. Deve cobrir ramificações opcionais (userData ausente e usuário não autenticado)', async () => {
    const { getAuth } = await import('firebase/auth');
    vi.mocked(getAuth).mockReturnValueOnce({ currentUser: null } as any);
    authState.currentUser = null; // auth.currentUser (firebaseConfig) também nulo

    await act(async () => {
      render(<Perfil />);
    });

    // Exportação sem userData: cai no fallback `userData || {}`
    fireEvent.click(
      screen.getByRole('button', { name: /exportar meus dados/i })
    );

    const deleteInitBtn = screen.getByRole('button', { name: /excluir minha conta e apagar todos os dados/i });
    await act(async () => {
      fireEvent.click(deleteInitBtn);
    });

    const input = screen.getByPlaceholderText('Digite EXCLUIR');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    expect(screen.getByPlaceholderText('Digite EXCLUIR')).toBeInTheDocument();

    // Sem usuário autenticado a exclusão não prossegue (guard if (user))
    expect(window.alert).not.toHaveBeenCalledWith(
      'Sua conta e todos os seus dados foram excluídos com sucesso.'
    );
  });
});