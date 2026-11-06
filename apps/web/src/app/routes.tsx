import { Navigate, type RouteObject } from 'react-router';

import { Layout } from '@/app/Layout';
import { DevicesPage } from '@/features/devices/DevicesPage';
import { FloorMapPage } from '@/features/floor-maps/components/FloorMapPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/devices', element: <DevicesPage /> },
      { path: '/floor-maps', element: <FloorMapPage /> },
      // Easter egg reached from the ping-pong table on a floor map: loaded only when opened.
      {
        path: '/pong',
        lazy: async () => ({ Component: (await import('@/features/pong/components/PongPage')).PongPage }),
      },
      { path: '*', element: <Navigate to="/devices" replace /> },
    ],
  },
];
