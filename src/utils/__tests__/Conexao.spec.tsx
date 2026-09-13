// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import { describe, it, afterEach, vi } from 'vitest';
import Conexao from '../../screens/Conexao';

describe('Conexao - Status de Redes e Sincronização', () => {
  afterEach(() => {
    cleanup();
  });

  it('deve renderizar a tela de conectividade sem erros', () => {
    const mockFn = vi.fn();

    render(
      <Conexao
        plan={'pro' as any}
        connectedMachines={[]}
        onConnect={mockFn}
        onDisconnect={mockFn}
        onDisconnectAll={mockFn}
      />
    );
  });
});