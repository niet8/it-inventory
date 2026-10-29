import { Navigate, type RouteObject } from 'react-router';

import { Layout } from '@/app/Layout';

// Each feature replaces its placeholder with its own page component.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/devices', element: <h1 className="text-xl font-semibold">Devices</h1> },
      { path: '/floor-maps', element: <h1 className="text-xl font-semibold">Floor maps</h1> },
      { path: '*', element: <Navigate to="/devices" replace /> },
    ],
  },
];
