import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(() => ({ marker: 'admin-client' })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

const projectRef = 'eerqeimqzkgdpvutjfhm';
const projectUrl = `https://${projectRef}.supabase.co`;

function legacyServiceRoleKey(ref = projectRef) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'supabase',
    ref,
    role: 'service_role',
    iat: 1,
    exp: 4102444800,
  })).toString('base64url');
  return `${header}.${payload}.test-signature`;
}

describe('getAdminSupabase — seleção de chave vinculada ao projeto', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('SUPABASE_URL', projectUrl);
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefere a chave explícita da branch quando service role e secret key coexistem', async () => {
    const branchKey = legacyServiceRoleKey();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', branchKey);
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_generic_preview_key');

    const { getAdminSupabase } = await import('./adminSupabase');
    const result = getAdminSupabase();

    expect(result).toEqual({ marker: 'admin-client' });
    expect(mockCreateClient).toHaveBeenCalledWith(projectUrl, branchKey, expect.any(Object));
  });

  it('ignora uma chave JWT de outro projeto e usa a secret key disponível como alternativa', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', legacyServiceRoleKey('genbxhvhmrgyflptnrpi'));
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_homologation_key');

    const { getAdminSupabase } = await import('./adminSupabase');
    getAdminSupabase();

    expect(mockCreateClient).toHaveBeenCalledWith(
      projectUrl,
      'sb_secret_homologation_key',
      expect.any(Object),
    );
  });

  it('falha antes de criar o cliente quando nenhuma chave corresponde ao projeto', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', legacyServiceRoleKey('genbxhvhmrgyflptnrpi'));
    vi.stubEnv('SUPABASE_SECRET_KEY', '');

    const { getAdminSupabase } = await import('./adminSupabase');

    expect(() => getAdminSupabase()).toThrow(/não corresponde ao projeto configurado/i);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('falha de forma explícita quando ambas as chaves estão ausentes', async () => {
    const { getAdminSupabase } = await import('./adminSupabase');

    expect(() => getAdminSupabase()).toThrow(/configuração administrativa.*ausente/i);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
