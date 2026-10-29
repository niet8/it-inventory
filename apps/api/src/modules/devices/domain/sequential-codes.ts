// Codes for a batch: "LAP-007" × 3 → LAP-007, LAP-008, LAP-009 (keeps the zero padding).
// A base without a trailing number gets one: "DOCK" × 2 → DOCK-1, DOCK-2.
export const sequentialCodes = (base: string, count: number): string[] => {
  if (count <= 1) return [base];

  const match = /^(.*?)(\d+)$/.exec(base);
  if (!match) return Array.from({ length: count }, (_, index) => `${base}-${index + 1}`);

  const [, prefix = '', digits = ''] = match;
  const start = Number(digits);
  return Array.from({ length: count }, (_, index) => `${prefix}${String(start + index).padStart(digits.length, '0')}`);
};
