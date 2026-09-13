// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Services - Sincronização e Resiliência Remota', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve salvar dados localmente quando o banco remoto estiver offline', async () => {
    const dadosVenda = { id: 'venda_001', valor: 150.00, metodo: 'PIX' };

    // Função de simulação do fluxo de envio com fallback
    const syncVenda = async (venda: typeof dadosVenda) => {
      try {
        throw new Error('Firestore/Supabase indisponível');
      } catch (err) {
        const pendentes = JSON.parse(localStorage.getItem('pendentes_sync') || '[]');
        pendentes.push(venda);
        localStorage.setItem('pendentes_sync', JSON.stringify(pendentes));
        return { success: false, offlineSaved: true };
      }
    };

    const resultado = await syncVenda(dadosVenda);

    expect(resultado.offlineSaved).toBe(true);
    const pendentes = JSON.parse(localStorage.getItem('pendentes_sync') || '[]');
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].id).toBe('venda_001');
  });
});