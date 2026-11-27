// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Painel from '../../screens/Painel';

describe('Painel - Resumo Financeiro', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela do painel sem erros', () => {
    const mockSetActiveTab = vi.fn();
    render(<Painel setActiveTab={mockSetActiveTab} />);
  });
});