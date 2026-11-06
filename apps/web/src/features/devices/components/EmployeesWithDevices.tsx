import type { Device, Employee } from '@it-inventory/contracts';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/features/devices/components/ConfirmDialog';
import { EmployeeDevicesCard } from '@/features/devices/components/EmployeeDevicesCard';
import { PaginationControls } from '@/features/devices/components/PaginationControls';
import { useDebouncedValue } from '@/features/devices/hooks/useDebouncedValue';
import { useTransitionDevice } from '@/features/devices/hooks/useDeviceMutations';
import { useDevices } from '@/features/devices/hooks/useDevices';
import { EmployeeFormDialog } from '@/features/employees/components/EmployeeFormDialog';
import { useDeleteEmployee } from '@/features/employees/hooks/useEmployeeMutations';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { AsyncState } from '@/shared/ui/AsyncState';
import { Input } from '@/shared/ui/input';

const EMPLOYEES_PER_PAGE = 10;
// API maximum; enough for the devices of one page of employees.
const DEVICES_PER_PAGE = 100;

export function EmployeesWithDevices() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const employees = useEmployees({ page, limit: EMPLOYEES_PER_PAGE, search: debouncedSearch || undefined });
  const employeeIds = useMemo(() => employees.data?.items.map(({ id }) => id) ?? [], [employees.data]);
  // One request for the whole page instead of one per employee.
  const devices = useDevices({ employeeIds, limit: DEVICES_PER_PAGE }, { enabled: employeeIds.length > 0 });
  const unassign = useTransitionDevice();
  const deleteEmployee = useDeleteEmployee();

  const devicesByEmployee = useMemo(() => {
    const grouped = new Map<string, Device[]>();
    for (const device of devices.data?.items ?? []) {
      if (!device.employeeId) continue;
      grouped.set(device.employeeId, [...(grouped.get(device.employeeId) ?? []), device]);
    }
    return grouped;
  }, [devices.data]);

  const handleUnassign = (device: Device) =>
    unassign.mutate(
      { id: device.id, transition: 'unassign' },
      { onSuccess: () => toast.success(`${device.name} is back in stock`) },
    );

  const handleDelete = (employee: Employee) =>
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => {
        toast.success(`${employee.fullName} deleted`);
        // Deleting the last employee of a page would otherwise leave an empty page behind.
        if (page > 1 && employees.data?.items.length === 1) setPage(page - 1);
      },
    });

  const items = employees.data?.items ?? [];

  return (
    <div className="space-y-4">
      <Input
        type="search"
        aria-label="Search employees"
        placeholder="Search employees"
        className="max-w-xs"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <AsyncState
        isLoading={employees.isLoading || (devices.isLoading && employeeIds.length > 0)}
        error={employees.error ?? devices.error}
        onRetry={() => void (employees.error ? employees.refetch() : devices.refetch())}
        isEmpty={items.length === 0}
        emptyMessage={debouncedSearch ? 'No employees match.' : 'No employees yet.'}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((employee) => (
            <EmployeeDevicesCard
              key={employee.id}
              employee={employee}
              devices={devicesByEmployee.get(employee.id) ?? []}
              onEdit={() => setEditing(employee)}
              onDelete={() => setDeleting(employee)}
              onUnassign={handleUnassign}
            />
          ))}
        </div>
        <PaginationControls
          page={page}
          limit={EMPLOYEES_PER_PAGE}
          total={employees.data?.total ?? 0}
          onPageChange={setPage}
        />
      </AsyncState>

      <EmployeeFormDialog open={editing !== null} onOpenChange={() => setEditing(null)} employee={editing} />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.fullName ?? 'employee'}?`}
        description="Their devices go back to stock. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleting && handleDelete(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
