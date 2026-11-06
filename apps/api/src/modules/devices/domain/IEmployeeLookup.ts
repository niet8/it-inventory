// What devices needs to know about employees, declared here so the module never imports `employees`.
export interface IEmployeeLookup {
  exists(employeeId: string): Promise<boolean>;
}
