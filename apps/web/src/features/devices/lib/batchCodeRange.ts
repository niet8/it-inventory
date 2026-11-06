// First and last code of a batch, mirroring how the API numbers it:
// "LAP-009" × 2 → LAP-009 … LAP-010 (zero padding kept); "DOCK" × 3 → DOCK-1 … DOCK-3.
export const batchCodeRange = (base: string, count: number): [first: string, last: string] | null => {
  const code = base.trim();
  if (!code || count <= 1) return null;

  const match = /^(.*?)(\d+)$/.exec(code);
  if (!match) return [`${code}-1`, `${code}-${count}`];

  const [, prefix = '', digits = ''] = match;
  const last = String(Number(digits) + count - 1).padStart(digits.length, '0');
  return [code, `${prefix}${last}`];
};
