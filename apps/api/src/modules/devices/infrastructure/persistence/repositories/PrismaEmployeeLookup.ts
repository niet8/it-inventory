import type { IEmployeeLookup } from '#modules/devices/domain/IEmployeeLookup';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

// Reads the employees table directly instead of importing the employees module: modules stay isolated.
export class PrismaEmployeeLookup implements IEmployeeLookup {
  constructor(private readonly database: Database) {}

  async exists(employeeId: string): Promise<boolean> {
    return (await this.database.employee.count({ where: { id: employeeId } })) > 0;
  }
}
