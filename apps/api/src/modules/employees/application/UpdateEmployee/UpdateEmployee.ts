import { type EmployeeView, toEmployeeView } from '#modules/employees/application/EmployeeView';
import type { EmployeeChanges } from '#modules/employees/domain/Employee';
import type { IEmployeeRepository } from '#modules/employees/domain/IEmployeeRepository';
import { NotFoundError } from '#shared/domain/DomainError';

export type UpdateEmployeeCommand = { id: string; changes: EmployeeChanges };

export class UpdateEmployee {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute({ id, changes }: UpdateEmployeeCommand): Promise<EmployeeView> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) throw new NotFoundError('Employee', id);

    const updated = employee.update(changes);
    await this.employeeRepository.save(updated);
    return toEmployeeView(updated);
  }
}
