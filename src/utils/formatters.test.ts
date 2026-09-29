// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoney } from './formatters';

describe('formatters - Casos Limite', () => {
  it('formatMoney: valores vazios ou sem dígitos retornam string vazia', () => {
    expect(formatMoney('')).toBe('');
    expect(formatMoney('abc')).toBe('');
  });

  it('formatMoney: valores inteiros sem separador decimal', () => {
    expect(formatMoney('0')).toBe('0,00');
    expect(formatMoney('1500')).toBe('1.500,00');
  });

  it('formatMoney: valores com separador decimal (vírgula e ponto)', () => {
    expect(formatMoney('1234,56')).toBe('1.234,56');
    expect(formatMoney('1.234,56')).toBe('1.234,56');
    expect(formatMoney('1.234.567,89')).toBe('1.234.567,89');
    expect(formatMoney('1234,5')).toBe('1.234,50');
    expect(formatMoney('0,99')).toBe('0,99');
    expect(formatMoney('99.9')).toBe('99,90');
    expect(formatMoney(',50')).toBe('0,50'); // sem parte inteira -> fallback '0'
  });

  it('parseMoney: vazio e inválido retornam 0', () => {
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });

  it('parseMoney: converte pt-BR para número', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('99,9')).toBeCloseTo(99.9);
    expect(parseMoney('1500')).toBe(1500);
    expect(parseMoney('0')).toBe(0);
  });
});
