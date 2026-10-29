import type { ApiFailure, ApiSuccess } from '@it-inventory/contracts';

export const ok = <T>(data: T): ApiSuccess<T> => ({ status: 'OK', data });
export const fail = (message: string): ApiFailure => ({ status: 'ERROR', message });
