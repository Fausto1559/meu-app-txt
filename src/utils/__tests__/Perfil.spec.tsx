// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import { describe, it, afterEach } from 'vitest';
import Perfil from '../../screens/Perfil';

describe('Perfil - Configurações do Usuário', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela de perfil sem erros', () => {
    render(<Perfil />);
  });
});