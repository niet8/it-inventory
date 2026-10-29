import './app/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { QueryProvider } from '@/app/QueryProvider';
import { routes } from '@/app/routes';
import { Toaster } from '@/shared/ui/sonner';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={createBrowserRouter(routes)} />
      <Toaster position="bottom-right" />
    </QueryProvider>
  </StrictMode>,
);
