import type { IEmployeeRepository } from '#modules/employees/domain/IEmployeeRepository';
import { NotFoundError } from '#shared/domain/DomainError';

export type DeleteEmployeeCommand = { id: string };

export class DeleteEmployee {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute({ id }: DeleteEmployeeCommand): Promise<void> {
    const deleted = await this.employeeRepository.delete(id);
    if (!deleted) throw new NotFoundError('Employee', id);
  }
}
