import { describe, expect, it } from 'vitest';

import { fail, ok } from '#shared/infrastructure/api/response';

describe('response helpers', () => {
  it('wraps data and errors in the API envelope', () => {
    expect(ok({ a: 1 })).toEqual({ status: 'OK', data: { a: 1 } });
    expect(fail('boom')).toEqual({ status: 'ERROR', message: 'boom' });
  });
});
