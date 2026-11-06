import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import {
  createFloorMapsHandlers,
  floorMapsRoutes,
} from '#modules/floor-maps/infrastructure/api/routes/floor-maps.routes';
import { InMemoryFloorMapRepository } from '#modules/floor-maps/infrastructure/persistence/repositories/InMemoryFloorMapRepository';
import { domainErrorHandler } from '#shared/infrastructure/api/domain-error-handler';

const EMPLOYEE = 'bbbbbbbb-0000-4000-8000-000000000001';
const DESK = 'aaaaaaaa-0000-4000-8000-000000000001';
const MISSING = 'cccccccc-0000-4000-8000-000000000001';

const buildApp = () => {
  const app = Fastify({ logger: false });
  app.setErrorHandler(domainErrorHandler);
  const handlers = createFloorMapsHandlers(new InMemoryFloorMapRepository(), {
    exists: async (id) => id === EMPLOYEE,
  });
  app.register(floorMapsRoutes(handlers), { prefix: '/floor-maps' });
  return app;
};

const layoutBody = (version: number, row = 1) => ({
  version,
  cols: 10,
  rows: 8,
  walls: ['h_0_0'],
  labels: [],
  objects: [{ id: DESK, typeId: 'desk', row, col: 1, rotation: 0 }],
});

describe('floor-maps routes', () => {
  it('runs the full lifecycle of a map', async () => {
    const app = buildApp();

    const created = await app.inject({ method: 'POST', url: '/floor-maps', payload: { name: 'Floor 1' } });
    expect(created.statusCode).toBe(201);
    const { id } = created.json().data;
    expect(created.json().data).toMatchObject({ cols: 10, rows: 8, version: 0 });

    const saved = await app.inject({ method: 'PUT', url: `/floor-maps/${id}/layout`, payload: layoutBody(0) });
    expect(saved.json().data.version).toBe(1);

    const assign = await app.inject({
      method: 'PATCH',
      url: `/floor-maps/${id}/objects/${DESK}/assign`,
      payload: { employeeId: EMPLOYEE },
    });
    expect(assign.json().data.objects[0].employeeId).toBe(EMPLOYEE);

    const renamed = await app.inject({ method: 'PATCH', url: `/floor-maps/${id}`, payload: { name: 'Ground' } });
    expect(renamed.json().data.name).toBe('Ground');

    const listed = await app.inject({ method: 'GET', url: '/floor-maps' });
    expect(listed.json().data).toHaveLength(1);

    const deleted = await app.inject({ method: 'DELETE', url: `/floor-maps/${id}` });
    expect(deleted.json()).toEqual({ status: 'OK', data: null });
  });

  it('answers 409 when two saves start from the same version', async () => {
    const app = buildApp();
    const { id } = (await app.inject({ method: 'POST', url: '/floor-maps', payload: { name: 'Floor 1' } })).json().data;

    await app.inject({ method: 'PUT', url: `/floor-maps/${id}/layout`, payload: layoutBody(0) });
    const stale = await app.inject({ method: 'PUT', url: `/floor-maps/${id}/layout`, payload: layoutBody(0, 4) });

    expect(stale.statusCode).toBe(409);
  });

  it('maps domain errors to their status', async () => {
    const app = buildApp();
    const { id } = (await app.inject({ method: 'POST', url: '/floor-maps', payload: { name: 'Floor 1' } })).json().data;
    const overlapping = {
      ...layoutBody(0),
      objects: [
        { id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 0 },
        { id: MISSING, typeId: 'sofa', row: 0, col: 0, rotation: 0 },
      ],
    };

    const overlap = await app.inject({ method: 'PUT', url: `/floor-maps/${id}/layout`, payload: overlapping });
    const missing = await app.inject({ method: 'DELETE', url: `/floor-maps/${MISSING}` });
    const unknownDesk = await app.inject({
      method: 'PATCH',
      url: `/floor-maps/${id}/objects/${DESK}/assign`,
      payload: { employeeId: null },
    });

    expect(overlap.statusCode).toBe(422);
    expect(missing.statusCode).toBe(404);
    expect(unknownDesk.json()).toEqual({ status: 'ERROR', message: `Floor map object ${DESK} not found` });
  });

  it('rejects malformed input before reaching the use cases', async () => {
    const app = buildApp();

    const badId = await app.inject({ method: 'DELETE', url: '/floor-maps/not-a-uuid' });
    const badBody = await app.inject({ method: 'POST', url: '/floor-maps', payload: { name: '', cols: 500 } });
    const employeeOnLayout = await app.inject({
      method: 'PUT',
      url: `/floor-maps/${MISSING}/layout`,
      payload: { ...layoutBody(0), objects: [{ ...layoutBody(0).objects[0], rotation: 45 }] },
    });

    expect([badId.statusCode, badBody.statusCode, employeeOnLayout.statusCode]).toEqual([400, 400, 400]);
    expect(badBody.json().message).toMatch(/name/);
  });
});
