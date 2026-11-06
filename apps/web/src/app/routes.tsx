import { Navigate, type RouteObject } from 'react-router';

import { Layout } from '@/app/Layout';
import { FloorMapPage } from '@/features/floor-maps/components/FloorMapPage';

// Each feature replaces its placeholder with its own page component.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/devices', element: <h1 className="text-xl font-semibold">Devices</h1> },
      { path: '/floor-maps', element: <FloorMapPage /> },
      { path: '*', element: <Navigate to="/devices" replace /> },
    ],
  },
];
