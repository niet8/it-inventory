import { DeviceStats } from '@/features/devices/components/DeviceStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export function DevicesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Devices</h1>
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
    </div>
  );
}
