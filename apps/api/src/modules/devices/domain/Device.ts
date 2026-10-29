import { randomUUID } from 'node:crypto';

import { BusinessRuleViolationError, ValidationError } from '#shared/domain/DomainError';

export type DeviceStatus = 'available' | 'in_use' | 'decommissioned';

export type DeviceData = {
  id: string;
  name: string;
  code: string | null;
  notes: string | null;
  employeeId: string | null;
  decommissionedAt: Date | null;
};

export type CreateDeviceParams = {
  name: string;
  code?: string | null | undefined;
  notes?: string | null | undefined;
};

// Omitted field = keep it; `null` = clear it. Status changes go through the transition methods.
export type DeviceChanges = {
  name?: string | undefined;
  code?: string | null | undefined;
  notes?: string | null | undefined;
};

const LIMITS = { name: 120, code: 40, notes: 500 } as const;

export class Device {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly code: string | null,
    readonly notes: string | null,
    readonly employeeId: string | null,
    readonly decommissionedAt: Date | null,
  ) {}

  static create(params: CreateDeviceParams): Device {
    return Device.validated({
      id: randomUUID(),
      name: params.name,
      code: params.code ?? null,
      notes: params.notes ?? null,
      employeeId: null,
      decommissionedAt: null,
    });
  }

  static rehydrate(data: DeviceData): Device {
    return new Device(data.id, data.name, data.code, data.notes, data.employeeId, data.decommissionedAt);
  }

  // Derived, never stored: a decommissioned device can't be assigned (also enforced by a DB CHECK).
  get status(): DeviceStatus {
    if (this.decommissionedAt) return 'decommissioned';
    return this.employeeId ? 'in_use' : 'available';
  }

  update(changes: DeviceChanges): Device {
    return Device.validated({
      ...this.data(),
      name: changes.name ?? this.name,
      code: changes.code === undefined ? this.code : changes.code,
      notes: changes.notes === undefined ? this.notes : changes.notes,
    });
  }

  assignTo(employeeId: string): Device {
    if (this.decommissionedAt) throw new BusinessRuleViolationError(`Device ${this.id} is decommissioned`);
    if (this.employeeId) throw new BusinessRuleViolationError(`Device ${this.id} is already assigned`);
    return Device.rehydrate({ ...this.data(), employeeId });
  }

  unassign(): Device {
    if (!this.employeeId) throw new BusinessRuleViolationError(`Device ${this.id} is not assigned`);
    return Device.rehydrate({ ...this.data(), employeeId: null });
  }

  decommission(at: Date = new Date()): Device {
    if (this.decommissionedAt) throw new BusinessRuleViolationError(`Device ${this.id} is already decommissioned`);
    return Device.rehydrate({ ...this.data(), employeeId: null, decommissionedAt: at });
  }

  reactivate(): Device {
    if (!this.decommissionedAt) throw new BusinessRuleViolationError(`Device ${this.id} is not decommissioned`);
    return Device.rehydrate({ ...this.data(), decommissionedAt: null });
  }

  private data(): DeviceData {
    const { id, name, code, notes, employeeId, decommissionedAt } = this;
    return { id, name, code, notes, employeeId, decommissionedAt };
  }

  private static validated(data: DeviceData): Device {
    const name = data.name.trim();
    if (!name) throw new ValidationError('Name is required', 'name');
    const code = data.code?.trim() || null;
    const notes = data.notes?.trim() || null;
    for (const [field, value] of [
      ['name', name],
      ['code', code],
      ['notes', notes],
    ] as const) {
      if (value && value.length > LIMITS[field]) {
        throw new ValidationError(`${field} must be at most ${LIMITS[field]} characters`, field);
      }
    }
    return Device.rehydrate({ ...data, name, code, notes });
  }
}
