import type { Employee } from '@it-inventory/contracts';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useCreateEmployee, useUpdateEmployee } from '@/features/employees/hooks/useEmployeeMutations';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type EmployeeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Edits this employee when given; otherwise creates one.
  employee?: Employee | null;
};

export function EmployeeFormDialog({ open, onOpenChange, employee }: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <EmployeeForm employee={employee ?? null} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({ employee, onDone }: { employee: Employee | null; onDone: () => void }) {
  const [fullName, setFullName] = useState(employee?.fullName ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [department, setDepartment] = useState(employee?.department ?? '');
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const isEdit = employee !== null;
  const isPending = createEmployee.isPending || updateEmployee.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) return;

    if (isEdit) {
      // Emptied fields are cleared on the server (null), not left untouched.
      const body = { fullName: name, email: email.trim() || null, department: department.trim() || null };
      updateEmployee.mutate(
        { id: employee.id, body },
        {
          onSuccess: () => {
            toast.success('Employee updated');
            onDone();
          },
        },
      );
      return;
    }

    const body = {
      fullName: name,
      ...(email.trim() && { email: email.trim() }),
      ...(department.trim() && { department: department.trim() }),
    };
    createEmployee.mutate(body, {
      onSuccess: () => {
        toast.success('Employee added');
        onDone();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogDescription>Only the full name is required.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="employee-name">Full name</Label>
        <Input
          id="employee-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="employee-email">Email</Label>
        <Input
          id="employee-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          maxLength={254}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="employee-department">Department</Label>
        <Input
          id="employee-department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          maxLength={80}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!fullName.trim() || isPending}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}
