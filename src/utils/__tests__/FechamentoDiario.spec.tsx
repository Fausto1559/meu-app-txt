import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FechamentoDiario } from '../../screens/FechamentoDiario';
import * as firestoreService from '../../services/firestoreService';

vi.mock('../../services/firestoreService');
vi.mock('../../services/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user-123' } }
}));

describe('FechamentoDiario - Integração e Resiliência', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deve calcular o Saldo Final Esperado corretamente com base na fórmula', async () => {
    render(<FechamentoDiario />);

    fireEvent.change(screen.getByLabelText(/Saldo Inicial/i), { target: { value: '100,00' } });
    fireEvent.change(screen.getByLabelText(/Entradas em Dinheiro/i), { target: { value: '500,00' } });
    fireEvent.change(screen.getByLabelText(/Saídas/i), { target: { value: '50,00' } });

    expect(screen.getByText(/550,00/)).toBeInTheDocument();
  });

  it('deve salvar no localStorage caso o Firestore falhe', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(firestoreService, 'saveUserRecord').mockRejectedValueOnce(new Error('Offline'));

    render(<FechamentoDiario />);
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Fechamento/i }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar no Firestore'));
    });

    const localData = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
    expect(localData).toHaveLength(1);
  });
});