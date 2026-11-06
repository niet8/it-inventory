import { describe, expect, it } from 'vitest';

import { batchCodeRange } from '@/features/devices/lib/batchCodeRange';

describe('batchCodeRange', () => {
  it('continues the trailing number keeping its padding', () => {
    expect(batchCodeRange('LAP-009', 2)).toEqual(['LAP-009', 'LAP-010']);
    expect(batchCodeRange('MON-098', 5)).toEqual(['MON-098', 'MON-102']);
  });

  it('appends a counter when the code has no trailing number', () => {
    expect(batchCodeRange('DOCK', 3)).toEqual(['DOCK-1', 'DOCK-3']);
  });

  it('has no range for a single device or an empty code', () => {
    expect(batchCodeRange('LAP-009', 1)).toBeNull();
    expect(batchCodeRange('  ', 4)).toBeNull();
  });
});
