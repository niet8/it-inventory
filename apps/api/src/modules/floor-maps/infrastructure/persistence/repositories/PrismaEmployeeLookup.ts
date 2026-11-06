import type { IEmployeeLookup } from '#modules/floor-maps/domain/IEmployeeLookup';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

export class PrismaEmployeeLookup implements IEmployeeLookup {
  constructor(private readonly db: Database) {}

  async exists(employeeId: string): Promise<boolean> {
    return (await this.db.employee.count({ where: { id: employeeId } })) > 0;
  }
}
