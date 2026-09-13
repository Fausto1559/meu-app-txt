// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import SalesCalculator from '../../screens/SalesCalculator';

describe('SalesCalculator - Operação de Balcão Interativa', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve simular entrada de dados do operador', async () => {
    const user = userEvent.setup();
    const mockOnSaleBooked = vi.fn();

    render(<SalesCalculator plan={'pro' as any} onSaleBooked={mockOnSaleBooked} />);

    // Localiza os inputs ou botões da tela
    const inputs = screen.getAllByRole('textbox');
    if (inputs.length > 0) {
      await user.type(inputs[0], '150');
      expect(inputs[0]).toHaveValue('150');
    }
  });
});