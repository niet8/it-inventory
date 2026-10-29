import { describe, expect, it, vi } from 'vitest';

import { ListEmployees } from '#modules/employees/application/ListEmployees/ListEmployees';
import { Employee } from '#modules/employees/domain/Employee';

describe('ListEmployees', () => {
  it('returns a page of views with the requested paging', async () => {
    const employee = Employee.rehydrate({ id: 'e-1', fullName: 'Ana Example', email: null, department: 'IT' });
    const list = vi.fn().mockResolvedValue({ items: [employee], total: 21 });
    const query = { page: 2, limit: 20, search: 'ana' };

    const page = await new ListEmployees({ findById: vi.fn(), save: vi.fn(), delete: vi.fn(), list }).execute(query);

    expect(list).toHaveBeenCalledWith(query);
    expect(page).toEqual({
      items: [{ id: 'e-1', fullName: 'Ana Example', email: null, department: 'IT' }],
      total: 21,
      page: 2,
      limit: 20,
    });
  });
});
