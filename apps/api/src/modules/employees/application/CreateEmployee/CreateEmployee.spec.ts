import { describe, expect, it, vi } from 'vitest';

import { CreateEmployee } from '#modules/employees/application/CreateEmployee/CreateEmployee';
import { Employee } from '#modules/employees/domain/Employee';
import { ConflictError, ValidationError } from '#shared/domain/DomainError';

const repository = () => ({
  findById: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  list: vi.fn(),
});

describe('CreateEmployee', () => {
  it('saves a new employee and returns its view', async () => {
    const employeeRepository = repository();

    const view = await new CreateEmployee(employeeRepository).execute({
      fullName: 'Ana Example',
      email: 'ANA@example.com',
    });

    expect(view).toEqual({
      id: expect.any(String),
      fullName: 'Ana Example',
      email: 'ana@example.com',
      department: null,
    });
    expect(employeeRepository.save).toHaveBeenCalledWith(expect.any(Employee));
  });

  it('does not save an invalid employee', async () => {
    const employeeRepository = repository();

    await expect(new CreateEmployee(employeeRepository).execute({ fullName: ' ' })).rejects.toThrow(ValidationError);
    expect(employeeRepository.save).not.toHaveBeenCalled();
  });

  it('propagates a duplicated email', async () => {
    const employeeRepository = repository();
    employeeRepository.save.mockRejectedValue(new ConflictError('Email ana@example.com is already in use'));

    await expect(
      new CreateEmployee(employeeRepository).execute({ fullName: 'Ana Example', email: 'ana@example.com' }),
    ).rejects.toThrow(ConflictError);
  });
});
