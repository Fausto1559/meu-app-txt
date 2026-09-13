export function formatMoney(value: string): string {
  if (!value) return '';
  const hasDecimal = value.includes(',') || value.includes('.');
  if (hasDecimal) {
    const lastSeparatorIndex = Math.max(value.lastIndexOf(','), value.lastIndexOf('.'));
    const intPart = value.slice(0, lastSeparatorIndex).replace(/\D/g, '');
    const decPart = value.slice(lastSeparatorIndex + 1).replace(/\D/g, '').slice(0, 2);
    const cents = (Number(intPart || '0') * 100) + Number(decPart.padEnd(2, '0'));
    const number = cents / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    const onlyNums = value.replace(/\D/g, '');
    if (!onlyNums) return '';
    const number = Number(onlyNums);
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function parseMoney(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}