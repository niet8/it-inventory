import { type EmployeePageView, toEmployeeView } from '#modules/employees/application/EmployeeView';
import type { EmployeeListQuery, IEmployeeRepository } from '#modules/employees/domain/IEmployeeRepository';

export type ListEmployeesQuery = EmployeeListQuery;

export class ListEmployees {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(query: ListEmployeesQuery): Promise<EmployeePageView> {
    const { items, total } = await this.employeeRepository.list(query);
    return { items: items.map(toEmployeeView), total, page: query.page, limit: query.limit };
  }
}
