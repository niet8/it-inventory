import { describe, expect, it } from 'vitest';

import {
  ACCENTED,
  containsPattern,
  foldAccents,
  UNACCENTED,
} from '#modules/employees/infrastructure/persistence/repositories/search-pattern';

describe('search pattern', () => {
  it('keeps the SQL translate() lists aligned', () => {
    expect([...ACCENTED]).toHaveLength([...UNACCENTED].length);
  });

  it('folds case and accents like the SQL side', () => {
    expect(foldAccents('ÁLVARO Núñez Çelik')).toBe('alvaro nunez celik');
  });

  it('wraps the term for a contains match and escapes LIKE wildcards', () => {
    expect(containsPattern('José')).toBe('%jose%');
    expect(containsPattern('50%_off\\')).toBe('%50\\%\\_off\\\\%');
  });
});
