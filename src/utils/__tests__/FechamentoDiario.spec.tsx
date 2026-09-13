// @vitest-environment jsdom
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

    const inputs = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(inputs[0], { target: { value: '100,00' } });
    fireEvent.change(inputs[1], { target: { value: '500,00' } });
    fireEvent.change(inputs[2], { target: { value: '50,00' } });

    expect(screen.getByText(/550,00/)).toBeInTheDocument();
  });

  it('deve salvar no localStorage caso o Firestore falhe', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(firestoreService, 'saveUserRecord').mockRejectedValueOnce(new Error('Offline'));

    render(<FechamentoDiario />);
    const inputs = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(inputs[0], { target: { value: '100,00' } });

    const buttons = screen.getAllByRole('button', { name: /Finalizar Fechamento/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar no Firestore'));
    });

    const localData = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
    expect(localData).toHaveLength(1);
  });
});