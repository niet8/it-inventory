import { randomUUID } from 'node:crypto';

import { ValidationError } from '#shared/domain/DomainError';

export type EmployeeData = {
  id: string;
  fullName: string;
  email: string | null;
  department: string | null;
};

export type CreateEmployeeParams = {
  fullName: string;
  email?: string | null | undefined;
  department?: string | null | undefined;
};

// Omitted field = keep it; `null` = clear it.
export type EmployeeChanges = {
  fullName?: string | undefined;
  email?: string | null | undefined;
  department?: string | null | undefined;
};

const FULL_NAME_MAX_LENGTH = 120;

export class Employee {
  private constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string | null,
    readonly department: string | null,
  ) {}

  static create(params: CreateEmployeeParams): Employee {
    return Employee.validated({
      id: randomUUID(),
      fullName: params.fullName,
      email: params.email ?? null,
      department: params.department ?? null,
    });
  }

  static rehydrate(data: EmployeeData): Employee {
    return new Employee(data.id, data.fullName, data.email, data.department);
  }

  update(changes: EmployeeChanges): Employee {
    return Employee.validated({
      id: this.id,
      fullName: changes.fullName ?? this.fullName,
      email: changes.email === undefined ? this.email : changes.email,
      department: changes.department === undefined ? this.department : changes.department,
    });
  }

  // Emails are compared case-insensitively, so they are stored lower-cased.
  private static validated(data: EmployeeData): Employee {
    const fullName = data.fullName.trim().replace(/\s+/g, ' ');
    if (!fullName) throw new ValidationError('Full name is required', 'fullName');
    if (fullName.length > FULL_NAME_MAX_LENGTH) {
      throw new ValidationError(`Full name must be at most ${FULL_NAME_MAX_LENGTH} characters`, 'fullName');
    }
    const email = data.email?.trim().toLowerCase() || null;
    const department = data.department?.trim() || null;
    return new Employee(data.id, fullName, email, department);
  }
}
