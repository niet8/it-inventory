import type {
  CreateFloorMapBody,
  Device,
  Employee,
  FloorMap,
  Paginated,
  SaveLayoutBody,
} from '@it-inventory/contracts';

import { apiRequest } from '@/shared/api/httpClient';

export const floorMapKeys = {
  list: ['floor-maps', 'list'] as const,
  employees: (search: string) => ['floor-maps', 'employees', search] as const,
  devicesOf: (employeeId: string) => ['floor-maps', 'devices', employeeId] as const,
};

export const floorMapsApi = {
  list: (signal?: AbortSignal) => apiRequest<FloorMap[]>('/floor-maps', signal ? { signal } : {}),
  create: (body: CreateFloorMapBody) => apiRequest<FloorMap>('/floor-maps', { method: 'POST', body }),
  rename: (id: string, name: string) => apiRequest<FloorMap>(`/floor-maps/${id}`, { method: 'PATCH', body: { name } }),
  saveLayout: (id: string, body: SaveLayoutBody) =>
    apiRequest<FloorMap>(`/floor-maps/${id}/layout`, { method: 'PUT', body }),
  assignDesk: (id: string, objectId: string, employeeId: string | null) =>
    apiRequest<FloorMap>(`/floor-maps/${id}/objects/${objectId}/assign`, { method: 'PATCH', body: { employeeId } }),
  remove: (id: string) => apiRequest<unknown>(`/floor-maps/${id}`, { method: 'DELETE' }),
};

// The picker and the desk badges only need a first page of the directory.
export const EMPLOYEE_PAGE_SIZE = 100;

export const fetchEmployees = (search: string, signal?: AbortSignal) =>
  apiRequest<Paginated<Employee>>('/employees', {
    query: { limit: EMPLOYEE_PAGE_SIZE, search },
    ...(signal ? { signal } : {}),
  });

export const fetchDevicesOf = (employeeId: string, signal?: AbortSignal) =>
  apiRequest<Paginated<Device>>('/devices', {
    query: { employeeIds: [employeeId], limit: 100 },
    ...(signal ? { signal } : {}),
  });
