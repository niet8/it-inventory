import { describe, expect, it } from 'vitest';

import { sequentialCodes } from '#modules/devices/domain/sequential-codes';

describe('sequentialCodes', () => {
  it.each([
    ['LAP-007', 3, ['LAP-007', 'LAP-008', 'LAP-009']],
    ['MON98', 3, ['MON98', 'MON99', 'MON100']],
    ['0009', 2, ['0009', '0010']],
    ['DOCK', 2, ['DOCK-1', 'DOCK-2']],
    ['LAP-001', 1, ['LAP-001']],
  ])('%s × %i', (base, count, expected) => {
    expect(sequentialCodes(base, count)).toEqual(expected);
  });
});
