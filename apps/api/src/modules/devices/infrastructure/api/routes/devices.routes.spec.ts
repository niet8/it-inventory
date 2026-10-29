import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { AssignDevice } from '#modules/devices/application/AssignDevice/AssignDevice';
import { CreateDevices } from '#modules/devices/application/CreateDevices/CreateDevices';
import { DecommissionDevice } from '#modules/devices/application/DecommissionDevice/DecommissionDevice';
import { DeleteDevice } from '#modules/devices/application/DeleteDevice/DeleteDevice';
import { GetDeviceStats } from '#modules/devices/application/GetDeviceStats/GetDeviceStats';
import { ListDevices } from '#modules/devices/application/ListDevices/ListDevices';
import { ReactivateDevice } from '#modules/devices/application/ReactivateDevice/ReactivateDevice';
import { UnassignDevice } from '#modules/devices/application/UnassignDevice/UnassignDevice';
import { UpdateDevice } from '#modules/devices/application/UpdateDevice/UpdateDevice';
import { Device } from '#modules/devices/domain/Device';
import { AssignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/AssignDeviceHandler';
import { CreateDevicesHandler } from '#modules/devices/infrastructure/api/handlers/CreateDevicesHandler';
import { DecommissionDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DecommissionDeviceHandler';
import { DeleteDeviceHandler } from '#modules/devices/infrastructure/api/handlers/DeleteDeviceHandler';
import { GetDeviceStatsHandler } from '#modules/devices/infrastructure/api/handlers/GetDeviceStatsHandler';
import { ListDevicesHandler } from '#modules/devices/infrastructure/api/handlers/ListDevicesHandler';
import { ReactivateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/ReactivateDeviceHandler';
import { UnassignDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UnassignDeviceHandler';
import { UpdateDeviceHandler } from '#modules/devices/infrastructure/api/handlers/UpdateDeviceHandler';
import { devicesRoutes } from '#modules/devices/infrastructure/api/routes/devices.routes';
import { domainErrorHandler } from '#shared/infrastructure/api/domain-error-handler';

const DEVICE_ID = '1b2c3d4e-5f60-4718-8a9b-0c1d2e3f4a5b';
const EMPLOYEE_ID = '9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d';
const laptop = Device.rehydrate({
  id: DEVICE_ID,
  name: 'Laptop',
  code: 'LAP-001',
  notes: null,
  employeeId: null,
  decommissionedAt: null,
});

const buildApp = () => {
  const repo = {
    findById: vi.fn().mockResolvedValue(laptop),
    createMany: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    assignIfAvailable: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    list: vi.fn().mockResolvedValue({ items: [laptop], total: 1 }),
    countByStatus: vi.fn().mockResolvedValue({ total: 1, available: 1, inUse: 0, decommissioned: 0 }),
  };
  const lookup = { exists: vi.fn().mockResolvedValue(true) };
  const app = Fastify();
  app.setErrorHandler(domainErrorHandler);
  app.register(
    devicesRoutes({
      create: new CreateDevicesHandler(new CreateDevices(repo)),
      update: new UpdateDeviceHandler(new UpdateDevice(repo)),
      delete: new DeleteDeviceHandler(new DeleteDevice(repo)),
      assign: new AssignDeviceHandler(new AssignDevice(repo, lookup)),
      unassign: new UnassignDeviceHandler(new UnassignDevice(repo)),
      decommission: new DecommissionDeviceHandler(new DecommissionDevice(repo)),
      reactivate: new ReactivateDeviceHandler(new ReactivateDevice(repo)),
      list: new ListDevicesHandler(new ListDevices(repo)),
      stats: new GetDeviceStatsHandler(new GetDeviceStats(repo)),
    }),
    { prefix: '/devices' },
  );
  return { app, repo };
};

describe('devices routes', () => {
  it('lists with a parsed status filter and repeated employeeIds', async () => {
    const { app, repo } = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: `/devices?status=available&employeeIds=${EMPLOYEE_ID}&employeeIds=${DEVICE_ID}`,
    });

    expect(response.statusCode).toBe(200);
    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: 'available',
      employeeIds: [EMPLOYEE_ID, DEVICE_ID],
    });
    expect(response.json().data.items[0]).toMatchObject({ id: DEVICE_ID, status: 'available' });
  });

  it('serves the stats', async () => {
    const response = await buildApp().app.inject({ method: 'GET', url: '/devices/stats' });

    expect(response.json()).toEqual({ status: 'OK', data: { total: 1, available: 1, inUse: 0, decommissioned: 0 } });
  });

  it('creates a batch with 201 and validates the quantity', async () => {
    const { app } = buildApp();

    const created = await app.inject({
      method: 'POST',
      url: '/devices',
      payload: { name: 'Mouse', code: 'MOU-01', quantity: 2 },
    });
    const invalid = await app.inject({ method: 'POST', url: '/devices', payload: { name: 'Mouse', quantity: 0 } });

    expect(created.statusCode).toBe(201);
    expect(created.json().data.map((d: { code: string }) => d.code)).toEqual(['MOU-01', 'MOU-02']);
    expect(invalid.statusCode).toBe(400);
  });

  it('updates and deletes by id', async () => {
    const { app } = buildApp();

    const updated = await app.inject({ method: 'PATCH', url: `/devices/${DEVICE_ID}`, payload: { notes: 'Dented' } });
    const deleted = await app.inject({ method: 'DELETE', url: `/devices/${DEVICE_ID}` });

    expect(updated.json().data).toMatchObject({ notes: 'Dented' });
    expect(deleted.json()).toEqual({ status: 'OK', data: { id: DEVICE_ID } });
  });

  it('runs the status transitions and maps rule violations to 422', async () => {
    const { app, repo } = buildApp();

    const assigned = await app.inject({
      method: 'PATCH',
      url: `/devices/${DEVICE_ID}/assign`,
      payload: { employeeId: EMPLOYEE_ID },
    });
    const decommissioned = await app.inject({ method: 'PATCH', url: `/devices/${DEVICE_ID}/decommission` });
    const notAssigned = await app.inject({ method: 'PATCH', url: `/devices/${DEVICE_ID}/unassign` });
    repo.findById.mockResolvedValueOnce(laptop.decommission());
    const reactivated = await app.inject({ method: 'PATCH', url: `/devices/${DEVICE_ID}/reactivate` });

    expect(assigned.json().data).toMatchObject({ employeeId: EMPLOYEE_ID, status: 'in_use' });
    expect(decommissioned.json().data).toMatchObject({ status: 'decommissioned' });
    expect(notAssigned.statusCode).toBe(422);
    expect(reactivated.json().data).toMatchObject({ status: 'available' });
  });

  it('rejects malformed ids and bodies', async () => {
    const { app } = buildApp();

    const badId = await app.inject({ method: 'PATCH', url: '/devices/nope/unassign' });
    const badBody = await app.inject({ method: 'PATCH', url: `/devices/${DEVICE_ID}/assign`, payload: {} });

    expect(badId.statusCode).toBe(400);
    expect(badBody.statusCode).toBe(400);
  });
});
