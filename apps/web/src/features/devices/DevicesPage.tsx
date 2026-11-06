import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { DeviceFormDialog } from '@/features/devices/components/DeviceFormDialog';
import { DeviceStats } from '@/features/devices/components/DeviceStats';
import { EmployeeFormDialog } from '@/features/employees/components/EmployeeFormDialog';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export function DevicesPage() {
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Devices</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddingEmployee(true)}>
            <PlusIcon aria-hidden />
            Add employee
          </Button>
          <Button onClick={() => setIsAddingDevice(true)}>
            <PlusIcon aria-hidden />
            Add device
          </Button>
        </div>
      </header>

      <DeviceStats />

      <Tabs defaultValue="by-employee">
        <TabsList>
          <TabsTrigger value="by-employee">By employee</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="by-employee" />
        <TabsContent value="stock" />
      </Tabs>

      <DeviceFormDialog open={isAddingDevice} onOpenChange={setIsAddingDevice} />
      <EmployeeFormDialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee} />
    </div>
  );
}
