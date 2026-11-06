import type { Employee } from '@it-inventory/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithQueryClient } from '@/features/devices/testing/renderWithQueryClient';
import * as employeesApi from '@/features/employees/api/employeesApi';
import { EmployeeFormDialog } from '@/features/employees/components/EmployeeFormDialog';

vi.mock('@/features/employees/api/employeesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof employeesApi>()),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));

const employee: Employee = {
  id: 'e0000000-0000-4000-8000-000000000001',
  fullName: 'Ada Example',
  email: 'ada@example.com',
  department: 'Design',
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('EmployeeFormDialog', () => {
  it('creates an employee leaving out empty optional fields', async () => {
    vi.mocked(employeesApi.createEmployee).mockResolvedValue(employee);
    const onOpenChange = vi.fn();
    renderWithQueryClient(<EmployeeFormDialog open onOpenChange={onOpenChange} />);

    await userEvent.type(screen.getByLabelText('Full name'), 'Ada Example');
    await userEvent.type(screen.getByLabelText('Department'), 'Design');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(employeesApi.createEmployee).mock.calls[0]?.[0]).toEqual({
      fullName: 'Ada Example',
      department: 'Design',
    });
  });

  it('clears an emptied field when editing', async () => {
    vi.mocked(employeesApi.updateEmployee).mockResolvedValue(employee);
    const onOpenChange = vi.fn();
    renderWithQueryClient(<EmployeeFormDialog open onOpenChange={onOpenChange} employee={employee} />);

    expect(screen.getByLabelText('Full name')).toHaveValue('Ada Example');
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(employeesApi.updateEmployee).mock.calls[0]?.[0]).toEqual({
      id: employee.id,
      body: { fullName: 'Ada Example', email: null, department: 'Design' },
    });
  });
});
