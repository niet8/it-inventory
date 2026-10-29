import { describe, expect, it } from 'vitest';

import { initials } from '@/shared/lib/initials';

describe('initials', () => {
  it.each([
    ['Ana María López', 'AL'],
    ['  bo   example ', 'BE'],
    ['Ana', 'A'],
    ['álvaro ñúñez', 'ÁÑ'],
    ['', '?'],
  ])('%j → %s', (fullName, expected) => {
    expect(initials(fullName)).toBe(expected);
  });
});
