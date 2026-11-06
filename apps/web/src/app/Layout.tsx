import { LaptopIcon, MapIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { ServerStatusBanner } from '@/app/ServerStatusBanner';
import { cn } from '@/shared/lib/utils';

const NAV_ITEMS = [
  { to: '/devices', label: 'Devices', icon: LaptopIcon },
  { to: '/floor-maps', label: 'Floor maps', icon: MapIcon },
] as const;

export function Layout() {
  return (
    <div className="min-h-dvh bg-background">
      <ServerStatusBanner />
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold">IT Inventory</span>
          <nav aria-label="Main" className="flex gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
