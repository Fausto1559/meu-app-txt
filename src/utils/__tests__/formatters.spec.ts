import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoney } from '../formatters';

describe('formatMoney & parseMoney (Fuzzing & Edge Cases)', () => {
  it('deve retornar string vazia para input vazio', () => {
    expect(formatMoney('')).toBe('');
  });

  it('deve normalizar entrada numérica simples', () => {
    expect(formatMoney('150')).toBe('150,00');
  });

  it('deve blindar parseMoney contra NaN e strings malformadas', () => {
    expect(parseMoney('abc')).toBe(0);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('1.000,50')).toBe(1000.5);
  });
});