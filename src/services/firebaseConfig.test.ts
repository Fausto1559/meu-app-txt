import { describe, it, expect, vi, afterEach } from 'vitest';

// Chaves lidas pelo firebaseConfig.js (todas com fallback via ||)
const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

describe('firebaseConfig - inicialização', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('exporta auth, db e googleProvider com a configuração do .env', async () => {
    const mod = await import('./firebaseConfig');

    expect(mod.auth).toBeDefined();
    expect(mod.db).toBeDefined();
    expect(mod.googleProvider).toBeDefined();
  });

  it('usa os valores de fallback quando as env vars estão vazias', async () => {
    ENV_KEYS.forEach((key) => vi.stubEnv(key, ''));

    const mod = await import('./firebaseConfig');

    // A inicialização segue de pé mesmo com o fallback (sem lançar no catch)
    expect(mod.auth).toBeDefined();
    expect(mod.db).toBeDefined();
  });

  it('registra o erro no console quando a inicialização do Firebase falha', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules();
    vi.doMock('firebase/app', () => ({
      getApps: vi.fn(() => []),
      getApp: vi.fn(() => ({})),
      initializeApp: vi.fn(() => {
        throw new Error('config inválida');
      }),
    }));

    const mod = await import('./firebaseConfig');

    expect(consoleError).toHaveBeenCalledWith(
      'Erro ao inicializar Firebase:',
      expect.any(Error)
    );
    expect(mod.auth).toBeUndefined();
    expect(mod.db).toBeUndefined();

    consoleError.mockRestore();
    vi.doUnmock('firebase/app');
    vi.resetModules();
  });
});
