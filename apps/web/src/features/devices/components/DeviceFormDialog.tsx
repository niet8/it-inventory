import type { Device } from '@it-inventory/contracts';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useCreateDevices, useUpdateDevice } from '@/features/devices/hooks/useDeviceMutations';
import { batchCodeRange } from '@/features/devices/lib/batchCodeRange';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const MAX_BATCH = 50;

type DeviceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Edits this device when given; otherwise creates a batch.
  device?: Device | null;
};

export function DeviceFormDialog({ open, onOpenChange, device }: DeviceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted per opening, so the fields start from the current device every time. */}
        {open && <DeviceForm device={device ?? null} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function DeviceForm({ device, onDone }: { device: Device | null; onDone: () => void }) {
  const [name, setName] = useState(device?.name ?? '');
  const [code, setCode] = useState(device?.code ?? '');
  const [notes, setNotes] = useState(device?.notes ?? '');
  const [quantity, setQuantity] = useState('1');
  const createDevices = useCreateDevices();
  const updateDevice = useUpdateDevice();

  const isEdit = device !== null;
  const count = Number(quantity);
  const validQuantity = Number.isInteger(count) && count >= 1 && count <= MAX_BATCH;
  const range = isEdit ? null : batchCodeRange(code, count);
  const isPending = createDevices.isPending || updateDevice.isPending;
  const canSubmit = name.trim() !== '' && (isEdit || validQuantity) && !isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (isEdit) {
      const body = { name: name.trim(), code: code.trim() || null, notes: notes.trim() || null };
      updateDevice.mutate(
        { id: device.id, body },
        {
          onSuccess: () => {
            toast.success('Device updated');
            onDone();
          },
        },
      );
      return;
    }

    const body = {
      name: name.trim(),
      quantity: count,
      ...(code.trim() && { code: code.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    };
    createDevices.mutate(body, {
      onSuccess: (created) => {
        toast.success(created.length === 1 ? 'Device added' : `${created.length} devices added`);
        onDone();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit device' : 'Add device'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Change the name, code or notes.' : 'Add one device or a numbered batch.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="device-name">Name</Label>
        <Input id="device-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="device-code">Code</Label>
        <Input
          id="device-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="LAP-001"
          maxLength={40}
        />
      </div>
      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="device-quantity">Quantity</Label>
          <Input
            id="device-quantity"
            type="number"
            min={1}
            max={MAX_BATCH}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={!validQuantity}
          />
          {range && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Codes: {range[0]} → {range[1]}
            </p>
          )}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="device-notes">Notes</Label>
        <Input id="device-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}
