import type { Device, DeviceStatus } from '@it-inventory/contracts';
import { useState } from 'react';
import { toast } from 'sonner';

import type { DeviceTransition } from '@/features/devices/api/devicesApi';
import { AssignDeviceDialog } from '@/features/devices/components/AssignDeviceDialog';
import { ConfirmDialog } from '@/features/devices/components/ConfirmDialog';
import { DeviceFormDialog } from '@/features/devices/components/DeviceFormDialog';
import { PaginationControls } from '@/features/devices/components/PaginationControls';
import { StockFilters } from '@/features/devices/components/StockFilters';
import { StockTable } from '@/features/devices/components/StockTable';
import { useDebouncedValue } from '@/features/devices/hooks/useDebouncedValue';
import { useDeleteDevice, useTransitionDevice } from '@/features/devices/hooks/useDeviceMutations';
import { useDevices } from '@/features/devices/hooks/useDevices';
import { AsyncState } from '@/shared/ui/AsyncState';

const DEVICES_PER_PAGE = 20;

const TRANSITION_MESSAGES: Record<DeviceTransition, (name: string) => string> = {
  unassign: (name) => `${name} is back in stock`,
  decommission: (name) => `${name} decommissioned`,
  reactivate: (name) => `${name} reactivated`,
};

export function StockTab() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<Device | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const devices = useDevices({
    page,
    limit: DEVICES_PER_PAGE,
    status: status ?? undefined,
    search: debouncedSearch || undefined,
  });
  const transition = useTransitionDevice();
  const deleteDevice = useDeleteDevice();

  const handleTransition = (device: Device, kind: DeviceTransition) =>
    transition.mutate(
      { id: device.id, transition: kind },
      { onSuccess: () => toast.success(TRANSITION_MESSAGES[kind](device.name)) },
    );

  const handleDelete = (device: Device) =>
    deleteDevice.mutate(device.id, {
      onSuccess: () => {
        toast.success(`${device.name} deleted`);
        if (page > 1 && devices.data?.items.length === 1) setPage(page - 1);
      },
    });

  const items = devices.data?.items ?? [];
  const isFiltered = status !== null || debouncedSearch !== '';

  return (
    <div className="space-y-4">
      <StockFilters
        status={status}
        onStatusChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
      />

      <AsyncState
        isLoading={devices.isLoading}
        error={devices.error}
        onRetry={() => void devices.refetch()}
        isEmpty={items.length === 0}
        emptyMessage={isFiltered ? 'No devices match these filters.' : 'No devices yet.'}
      >
        <StockTable
          devices={items}
          onAssign={setAssigning}
          onEdit={setEditing}
          onTransition={handleTransition}
          onDelete={setDeleting}
        />
        <PaginationControls
          page={page}
          limit={DEVICES_PER_PAGE}
          total={devices.data?.total ?? 0}
          onPageChange={setPage}
        />
      </AsyncState>

      <AssignDeviceDialog device={assigning} onClose={() => setAssigning(null)} />
      <DeviceFormDialog open={editing !== null} onOpenChange={() => setEditing(null)} device={editing} />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'device'}?`}
        description="The device is removed from the inventory. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleting && handleDelete(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
