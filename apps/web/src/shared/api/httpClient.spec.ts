import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest } from '@/shared/api/httpClient';

const respondWith = (status: number, body: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('returns the data of a successful envelope', async () => {
    respondWith(200, { status: 'OK', data: { id: 'd-1' } });

    await expect(apiRequest('/devices/d-1')).resolves.toEqual({ id: 'd-1' });
  });

  it('serialises the query string, repeating arrays and skipping empty values', async () => {
    const fetchMock = respondWith(200, { status: 'OK', data: [] });

    await apiRequest('/devices', { query: { page: 2, search: '', status: undefined, employeeIds: ['a', 'b'] } });

    const url = fetchMock.mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe('/devices');
    expect(url.search).toBe('?page=2&employeeIds=a&employeeIds=b');
  });

  it('sends JSON bodies with the right content type', async () => {
    const fetchMock = respondWith(201, { status: 'OK', data: null });

    await apiRequest('/employees', { method: 'POST', body: { fullName: 'Ana Example' } });

    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"fullName":"Ana Example"}',
    });
  });

  it('throws an ApiError with the server message and status', async () => {
    respondWith(409, { status: 'ERROR', message: 'Email already in use' });

    await expect(apiRequest('/employees')).rejects.toEqual(new ApiError('Email already in use', 409));
  });

  it('reports network failures and non-JSON answers as ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/devices')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the server' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })));
    await expect(apiRequest('/devices')).rejects.toMatchObject({ status: 502 });
  });

  it('lets aborted requests propagate untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    await expect(apiRequest('/devices')).rejects.toBe(abort);
  });
});
