import { type EmployeeView, toEmployeeView } from '#modules/employees/application/EmployeeView';
import { type CreateEmployeeParams, Employee } from '#modules/employees/domain/Employee';
import type { IEmployeeRepository } from '#modules/employees/domain/IEmployeeRepository';

export type CreateEmployeeCommand = CreateEmployeeParams;

export class CreateEmployee {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(command: CreateEmployeeCommand): Promise<EmployeeView> {
    const employee = Employee.create(command);
    await this.employeeRepository.save(employee);
    return toEmployeeView(employee);
  }
}
