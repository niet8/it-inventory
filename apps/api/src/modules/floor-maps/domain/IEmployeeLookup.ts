// This module's own view of employees: it only needs to know whether one exists.
export interface IEmployeeLookup {
  exists(employeeId: string): Promise<boolean>;
}
