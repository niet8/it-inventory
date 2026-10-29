import { describe, expect, it } from 'vitest';

import { createQueryClient } from '@/app/QueryProvider';
import { ApiError } from '@/shared/api/httpClient';

describe('createQueryClient', () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry as (count: number, error: Error) => boolean;

  it('never retries client errors', () => {
    expect(retry(0, new ApiError('Device d-1 not found', 404))).toBe(false);
  });

  it('retries network and server errors once', () => {
    expect(retry(0, new ApiError('Cannot reach the server', 0))).toBe(true);
    expect(retry(0, new ApiError('Internal server error', 500))).toBe(true);
    expect(retry(1, new ApiError('Internal server error', 500))).toBe(false);
  });
});
