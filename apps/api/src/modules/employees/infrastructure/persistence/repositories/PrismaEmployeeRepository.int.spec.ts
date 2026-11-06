import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { Employee } from '#modules/employees/domain/Employee';
import { PrismaEmployeeRepository } from '#modules/employees/infrastructure/persistence/repositories/PrismaEmployeeRepository';
import { ConflictError } from '#shared/domain/DomainError';
import { createPrismaClient } from '#shared/infrastructure/persistence/prisma-client';

const database = createPrismaClient(process.env.DATABASE_URL ?? '');
const repository = new PrismaEmployeeRepository(database);
const created: string[] = [];

// Unique suffix so this suite never collides with rows from other suites or manual tests.
const tag = `it${Date.now()}`;
const saved = async (fullName: string, extra: { email?: string; department?: string } = {}) => {
  const employee = Employee.create({ fullName: `${fullName} ${tag}`, ...extra });
  await repository.save(employee);
  created.push(employee.id);
  return employee;
};

afterEach(async () => {
  await database.employee.deleteMany({ where: { id: { in: created.splice(0) } } });
});

afterAll(async () => {
  await database.$disconnect();
});

describe('PrismaEmployeeRepository', () => {
  it('inserts, reads back and updates an employee', async () => {
    const employee = await saved('Ana Example', { email: `ana.${tag}@example.com` });

    await repository.save(employee.update({ department: 'Finance' }));

    expect(await repository.findById(employee.id)).toMatchObject({ id: employee.id, department: 'Finance' });
    expect(await repository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('turns a duplicated email into a ConflictError', async () => {
    await saved('Ana Example', { email: `dup.${tag}@example.com` });

    await expect(saved('Bo Example', { email: `dup.${tag}@example.com` })).rejects.toThrow(ConflictError);
  });

  it('deletes and reports whether something was deleted', async () => {
    const employee = await saved('Ana Example');

    expect(await repository.delete(employee.id)).toBe(true);
    expect(await repository.delete(employee.id)).toBe(false);
  });

  it('searches ignoring case and accents, filters by department and paginates', async () => {
    await saved('José Núñez', { department: 'Tecnología' });
    await saved('Jose Example', { department: 'Finance' });
    await saved('Zoe Example', { department: 'Tecnologia' });

    const byName = await repository.list({ page: 1, limit: 10, search: `jose ` });
    const byDepartment = await repository.list({ page: 1, limit: 10, search: tag, department: 'TECNOLOGÍA' });
    const secondPage = await repository.list({ page: 2, limit: 2, search: tag });

    expect(byName.items.map((e) => e.fullName).filter((name) => name.endsWith(tag))).toEqual([
      `Jose Example ${tag}`,
      `José Núñez ${tag}`,
    ]);
    expect(byDepartment.items.map((e) => e.fullName)).toEqual([`José Núñez ${tag}`, `Zoe Example ${tag}`]);
    expect(secondPage).toMatchObject({ total: 3, items: [{ fullName: `Zoe Example ${tag}` }] });
  });

  it('matches LIKE wildcards literally', async () => {
    await saved('Percent 100% Example');

    expect((await repository.list({ page: 1, limit: 10, search: `100%` })).total).toBeGreaterThanOrEqual(1);
    expect((await repository.list({ page: 1, limit: 10, search: `1_0% ${tag}` })).total).toBe(0);
  });
});
