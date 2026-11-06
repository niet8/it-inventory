import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { type EmployeesQuery, employeeKeys, listEmployees } from '@/features/employees/api/employeesApi';

export const useEmployees = (query: EmployeesQuery) =>
  useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: ({ signal }) => listEmployees(query, signal),
    placeholderData: keepPreviousData,
  });
