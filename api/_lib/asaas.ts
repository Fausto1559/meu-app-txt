const ASAAS_SANDBOX_BASE_URL = 'https://api-sandbox.asaas.com/v3';

export class AsaasApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

export async function asaasRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new AsaasApiError('Credencial do Asaas Sandbox ausente no servidor.', 503);
  }

  const response = await fetch(`${ASAAS_SANDBOX_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'User-Agent': 'CopilotoFinanceiro/1.0.0',
      access_token: apiKey,
      ...init.headers,
    },
  });

  const raw = await response.text();
  let payload: any = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = Array.isArray(payload?.errors)
      ? payload.errors.map((item: any) => String(item?.description || item?.code || '')).filter(Boolean).join('; ')
      : '';
    throw new AsaasApiError(
      detail ? `Asaas recusou a requisição: ${detail}` : `Asaas retornou HTTP ${response.status}.`,
      response.status,
    );
  }

  return payload as T;
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11 && digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  if (digits.length === 11) {
    const calculate = (base: string, factor: number) => {
      let sum = 0;
      for (const digit of base) sum += Number(digit) * factor--;
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };
    const first = calculate(digits.slice(0, 9), 10);
    const second = calculate(digits.slice(0, 9) + String(first), 11);
    return digits.endsWith(`${first}${second}`);
  }

  const calculate = (base: string, factors: number[]) => {
    const sum = [...base].reduce((total, digit, index) => total + Number(digit) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculate(digits.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
  const second = calculate(digits.slice(0, 12) + String(first), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return digits.endsWith(`${first}${second}`);
}
