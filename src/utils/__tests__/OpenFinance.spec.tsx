// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import { describe, it, afterEach } from 'vitest';
import { OpenFinance } from '../../screens/OpenFinance';

describe('OpenFinance - Integração Bancária', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela de Open Finance sem erros', () => {
    render(<OpenFinance />);
  });
});