import type { ApiResponse } from '@it-inventory/contracts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | null | undefined | readonly string[];

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
};

const buildUrl = (path: string, query: RequestOptions['query'] = {}): URL => {
  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, item);
    else if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
};

const buildInit = ({ method = 'GET', body, signal }: RequestOptions): RequestInit => {
  const init: RequestInit = { method };
  if (signal) init.signal = signal;
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return init;
};

// Unwraps the API envelope: resolves with `data` or throws an ApiError carrying the server message.
export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), buildInit(options));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server', 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!payload) throw new ApiError(`Unexpected response from the server (${response.status})`, response.status);
  if (payload.status === 'ERROR') throw new ApiError(payload.message, response.status);
  return payload.data;
};
