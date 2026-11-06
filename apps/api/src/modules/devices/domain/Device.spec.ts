import { describe, expect, it } from 'vitest';

import { Device } from '#modules/devices/domain/Device';
import { BusinessRuleViolationError, ValidationError } from '#shared/domain/DomainError';

const stored = (overrides: Partial<Parameters<typeof Device.rehydrate>[0]> = {}) =>
  Device.rehydrate({
    id: 'd-1',
    name: 'Laptop',
    code: null,
    notes: null,
    employeeId: null,
    decommissionedAt: null,
    ...overrides,
  });

describe('Device', () => {
  it('starts available with trimmed fields', () => {
    const device = Device.create({ name: ' Laptop ', code: ' LAP-001 ', notes: '  ' });

    expect(device).toMatchObject({ name: 'Laptop', code: 'LAP-001', notes: null, employeeId: null });
    expect(device.status).toBe('available');
  });

  it('validates required and maximum lengths', () => {
    expect(() => Device.create({ name: ' ' })).toThrow(ValidationError);
    expect(() => Device.create({ name: 'Laptop', code: 'x'.repeat(41) })).toThrow(/code must be at most 40/);
    expect(() => stored().update({ notes: 'x'.repeat(501) })).toThrow(/notes must be at most 500/);
  });

  it('derives the status from assignment and decommission date', () => {
    expect(stored({ employeeId: 'e-1' }).status).toBe('in_use');
    expect(stored({ decommissionedAt: new Date() }).status).toBe('decommissioned');
  });

  it('updates descriptive fields without touching the assignment', () => {
    const updated = stored({ employeeId: 'e-1', code: 'LAP-001' }).update({ name: 'Laptop Pro', code: null });

    expect(updated).toMatchObject({ name: 'Laptop Pro', code: null, employeeId: 'e-1' });
  });

  it('assigns an available device and refuses the other cases', () => {
    const original = stored();
    const assigned = original.assignTo('e-1');

    expect(assigned.employeeId).toBe('e-1');
    expect(original.employeeId).toBeNull();
    expect(() => assigned.assignTo('e-2')).toThrow(/already assigned/);
    expect(() => stored({ decommissionedAt: new Date() }).assignTo('e-1')).toThrow(BusinessRuleViolationError);
  });

  it('unassigns only an assigned device', () => {
    expect(stored({ employeeId: 'e-1' }).unassign().status).toBe('available');
    expect(() => stored().unassign()).toThrow(/not assigned/);
  });

  it('decommissions by releasing the employee and reactivates back to stock', () => {
    const at = new Date('2026-10-01T10:00:00Z');

    const decommissioned = stored({ employeeId: 'e-1' }).decommission(at);

    expect(decommissioned).toMatchObject({ employeeId: null, decommissionedAt: at });
    expect(() => decommissioned.decommission()).toThrow(/already decommissioned/);
    expect(decommissioned.reactivate().status).toBe('available');
    expect(() => stored().reactivate()).toThrow(/not decommissioned/);
  });
});
