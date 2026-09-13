// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import { describe, it, afterEach } from 'vitest';
import { Privacidade } from '../../screens/Privacidade';

describe('Privacidade - Termos e Segurança', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela de privacidade sem erros', () => {
    render(<Privacidade />);
  });
});