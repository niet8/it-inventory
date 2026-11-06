import { type FormEvent, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const MAX_NAME_LENGTH = 80;

type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialName?: string;
  pending?: boolean;
  onSubmit: (name: string) => void;
};

function NameForm({ initialName = '', submitLabel, pending, onSubmit, onCancel }: NameFormProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed) onSubmit(trimmed);
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="floor-map-name">Name</Label>
        <Input
          id="floor-map-name"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="text-base md:text-sm"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!trimmed || pending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

type NameFormProps = Pick<NameDialogProps, 'initialName' | 'submitLabel' | 'pending' | 'onSubmit'> & {
  onCancel: () => void;
};

// Shared by "new map" and "rename map".
export function NameDialog({ open, onOpenChange, title, description, ...form }: NameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <NameForm {...form} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
