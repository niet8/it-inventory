import type { Employee } from '@it-inventory/contracts';
import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';

import { fetchEmployees, floorMapKeys } from '@/features/floor-maps/api/floorMapsApi';
import { Avatar } from '@/shared/ui/Avatar';
import { Input } from '@/shared/ui/input';

const VISIBLE_RESULTS = 6;

type EmployeePickerProps = {
  currentId: string | null;
  onPick: (employee: Employee) => void;
};

export function EmployeePicker({ currentId, onPick }: EmployeePickerProps) {
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search.trim());
  const { data, isPending, error } = useQuery({
    queryKey: floorMapKeys.employees(term),
    queryFn: ({ signal }) => fetchEmployees(term, signal),
    placeholderData: (previous) => previous,
  });
  const results = (data?.items ?? []).filter((employee) => employee.id !== currentId).slice(0, VISIBLE_RESULTS);

  return (
    <div className="grid gap-1.5">
      <Input
        aria-label="Search employees"
        placeholder="Search employees…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-8 text-base md:text-sm"
      />
      {error ? (
        <p className="text-xs text-destructive">{error.message}</p>
      ) : (
        <ul aria-label="Employees" className="grid max-h-48 gap-0.5 overflow-y-auto">
          {results.map((employee) => (
            <li key={employee.id}>
              <button
                type="button"
                onClick={() => onPick(employee)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted"
              >
                <Avatar fullName={employee.fullName} className="size-6 text-[10px]" />
                <span className="flex-1 truncate">{employee.fullName}</span>
                {employee.department && (
                  <span className="truncate text-xs text-muted-foreground">{employee.department}</span>
                )}
              </button>
            </li>
          ))}
          {!isPending && results.length === 0 && (
            <li className="px-1.5 py-1 text-xs text-muted-foreground">No employees found</li>
          )}
        </ul>
      )}
    </div>
  );
}
