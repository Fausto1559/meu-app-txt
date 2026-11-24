import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asaasRequest, getAsaasEnvironment, isValidCpfCnpj, AsaasApiError } from './asaas';

describe('Asaas server integration — environment, credentials and validation', () => {
  beforeEach(() => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('ASAAS_ENVIRONMENT', '');
    vi.stubEnv('ASAAS_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('defaults Preview to Sandbox when no environment is specified', () => {
    expect(getAsaasEnvironment()).toBe('sandbox');
  });

  it('requires an explicit environment in Production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    expect(() => getAsaasEnvironment()).toThrowError(AsaasApiError);
    expect(() => getAsaasEnvironment()).toThrow(/deve ser definido explicitamente/i);
  });

  it('rejects unknown Asaas environments', () => {
    vi.stubEnv('ASAAS_ENVIRONMENT', 'staging');

    expect(() => getAsaasEnvironment()).toThrow(/ASAAS_ENVIRONMENT inválido/i);
  });

  it('does not call the network when the server API key is missing', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    await expect(asaasRequest('/myAccount/status/')).rejects.toMatchObject({
      status: 503,
      name: 'AsaasApiError',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends the API key only as the Asaas access_token header and parses JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'acc_sandbox_test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', mockFetch);
    vi.stubEnv('ASAAS_API_KEY', 'test_sandbox_api_key');
    vi.stubEnv('ASAAS_ENVIRONMENT', 'sandbox');

    const result = await asaasRequest<{ id: string }>('/myAccount/status/');

    expect(result).toEqual({ id: 'acc_sandbox_test' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api-sandbox.asaas.com/v3/myAccount/status/');
    expect(mockFetch.mock.calls[0][1].headers.access_token).toBe('test_sandbox_api_key');
    expect(mockFetch.mock.calls[0][1].headers['User-Agent']).toBe('CopilotoFinanceiro/1.0.0');
  });

  it('preserves the provider HTTP status without leaking the API key', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ description: 'Invalid credentials' }] }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', mockFetch);
    vi.stubEnv('ASAAS_API_KEY', 'test_sandbox_api_key');

    try {
      await asaasRequest('/myAccount/status/');
      throw new Error('Expected AsaasApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(AsaasApiError);
      expect(error).toMatchObject({ status: 401 });
      expect((error as Error).message).toContain('Invalid credentials');
      expect((error as Error).message).not.toContain('test_sandbox_api_key');
    }
  });

  it('validates CPF and CNPJ check digits', () => {
    expect(isValidCpfCnpj('529.982.247-25')).toBe(true);
    expect(isValidCpfCnpj('11.111.111/1111-11')).toBe(false);
    expect(isValidCpfCnpj('123.456.789-00')).toBe(false);
    expect(isValidCpfCnpj('123')).toBe(false);
  });
});
