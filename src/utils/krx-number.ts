export function parseKrxNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function isKrxNumericString(value: string): boolean {
  return /^-?[\d,]+\.?\d*$/.test(value.trim());
}
