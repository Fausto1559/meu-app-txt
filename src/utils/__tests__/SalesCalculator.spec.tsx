// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import { describe, it, afterEach, vi } from 'vitest';
import SalesCalculator from '../../screens/SalesCalculator';

describe('SalesCalculator - Operação de Balcão', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a calculadora de vendas sem erros', () => {
    const mockOnSaleBooked = vi.fn();

    render(<SalesCalculator plan={'pro' as any} onSaleBooked={mockOnSaleBooked} />);
  });
});