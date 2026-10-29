import { Prisma } from '#generated/prisma/client';
import type { Employee } from '#modules/employees/domain/Employee';
import type {
  EmployeeListQuery,
  EmployeePage,
  IEmployeeRepository,
} from '#modules/employees/domain/IEmployeeRepository';
import {
  EmployeeMapper,
  type EmployeeRecord,
} from '#modules/employees/infrastructure/persistence/mappers/EmployeeMapper';
import {
  ACCENTED,
  containsPattern,
  UNACCENTED,
} from '#modules/employees/infrastructure/persistence/repositories/search-pattern';
import { ConflictError } from '#shared/domain/DomainError';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const folded = (column: Prisma.Sql) => Prisma.sql`translate(lower(${column}), ${ACCENTED}, ${UNACCENTED})`;

export class PrismaEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Employee | null> {
    const row = await this.database.employee.findUnique({ where: { id } });
    return row ? EmployeeMapper.toDomain(row) : null;
  }

  async save(employee: Employee): Promise<void> {
    const record = EmployeeMapper.toPersistence(employee);
    try {
      await this.database.employee.upsert({ where: { id: record.id }, create: record, update: record });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError(`Email ${record.email} is already in use`);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.database.employee.deleteMany({ where: { id } });
    return count > 0;
  }

  // Raw SQL so that "jose" finds "José": Prisma's `contains` only folds case, not accents.
  async list({ page, limit, search, department }: EmployeeListQuery): Promise<EmployeePage> {
    const conditions: Prisma.Sql[] = [];
    if (search) conditions.push(Prisma.sql`${folded(Prisma.raw('full_name'))} LIKE ${containsPattern(search)}`);
    if (department)
      conditions.push(Prisma.sql`${folded(Prisma.raw('department'))} LIKE ${containsPattern(department)}`);
    const where = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    const [rows, [counted]] = await Promise.all([
      this.database.$queryRaw<EmployeeRecord[]>`
        SELECT id, full_name AS "fullName", email, department FROM employees ${where}
        ORDER BY full_name, id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      this.database.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM employees ${where}`,
    ]);
    return { items: rows.map(EmployeeMapper.toDomain), total: counted?.total ?? 0 };
  }
}
