import type {
  CreateDevicesBody,
  Device,
  DeviceStats,
  DeviceStatus,
  Paginated,
  UpdateDeviceBody,
} from '@it-inventory/contracts';

import { apiRequest } from '@/shared/api/httpClient';

export type DevicesQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  status?: DeviceStatus | undefined;
  search?: string | undefined;
  employeeIds?: readonly string[] | undefined;
};

// Status changes that need nothing but the device id.
export type DeviceTransition = 'unassign' | 'decommission' | 'reactivate';

export const listDevices = (query: DevicesQuery, signal: AbortSignal) =>
  apiRequest<Paginated<Device>>('/devices', { query, signal });

export const getDeviceStats = (signal: AbortSignal) => apiRequest<DeviceStats>('/devices/stats', { signal });

export const createDevices = (body: CreateDevicesBody) => apiRequest<Device[]>('/devices', { method: 'POST', body });

export const updateDevice = ({ id, body }: { id: string; body: UpdateDeviceBody }) =>
  apiRequest<Device>(`/devices/${id}`, { method: 'PATCH', body });

export const deleteDevice = (id: string) => apiRequest<null>(`/devices/${id}`, { method: 'DELETE' });

export const assignDevice = ({ id, employeeId }: { id: string; employeeId: string }) =>
  apiRequest<Device>(`/devices/${id}/assign`, { method: 'PATCH', body: { employeeId } });

export const transitionDevice = ({ id, transition }: { id: string; transition: DeviceTransition }) =>
  apiRequest<Device>(`/devices/${id}/${transition}`, { method: 'PATCH' });
