import type { FloorMap } from '@it-inventory/contracts';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { NameDialog } from '@/features/floor-maps/components/NameDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type MapSelectorProps = {
  maps: FloorMap[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

type DialogKind = 'create' | 'rename' | 'delete' | null;

export function MapSelector({ maps, activeId, onSelect, onCreate, onRename, onDelete }: MapSelectorProps) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pending, setPending] = useState(false);
  const active = maps.find((map) => map.id === activeId) ?? null;

  // Dialogs close only when the request succeeds; the caller reports failures.
  const run = (action: () => Promise<unknown>) => {
    setPending(true);
    action()
      .then(() => setDialog(null))
      .catch(() => {})
      .finally(() => setPending(false));
  };
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={activeId ?? ''} onValueChange={onSelect} disabled={maps.length === 0}>
        <SelectTrigger aria-label="Floor map" className="w-56">
          <SelectValue placeholder={maps.length === 0 ? 'No maps yet' : 'Choose a map'} />
        </SelectTrigger>
        <SelectContent>
          {maps.map((map) => (
            <SelectItem key={map.id} value={map.id}>
              {map.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => setDialog('create')}>
        <PlusIcon aria-hidden />
        New map
      </Button>
      {active && (
        <>
          <Button variant="ghost" size="icon-sm" aria-label="Rename map" onClick={() => setDialog('rename')}>
            <PencilIcon aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete map" onClick={() => setDialog('delete')}>
            <Trash2Icon aria-hidden />
          </Button>
        </>
      )}

      <NameDialog
        open={dialog === 'create'}
        onOpenChange={close}
        title="New floor map"
        description="It starts as an empty 10 × 8 grid; you can resize it from the editor."
        submitLabel="Create"
        pending={pending}
        onSubmit={(name) => run(() => onCreate(name))}
      />
      {active && (
        <NameDialog
          open={dialog === 'rename'}
          onOpenChange={close}
          title="Rename floor map"
          description="Only the name changes; the layout stays as it is."
          submitLabel="Save"
          initialName={active.name}
          pending={pending}
          onSubmit={(name) => run(() => onRename(active.id, name))}
        />
      )}
      <AlertDialog open={dialog === 'delete'} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{active?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The map, its layout and its desk assignments are removed for good. Employees and devices are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                if (active) run(() => onDelete(active.id));
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
