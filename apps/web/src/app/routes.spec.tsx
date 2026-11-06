import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/app/QueryProvider';
import { routes } from '@/app/routes';

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>,
  );
  return router;
};

// Pages fetch on mount; these tests only care about navigation, so requests never settle.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('app routes', () => {
  it('sends unknown paths to the devices page', () => {
    const router = renderAt('/nowhere');

    expect(router.state.location.pathname).toBe('/devices');
    expect(screen.getByRole('heading', { name: 'Devices' })).toBeInTheDocument();
  });

  it('navigates between sections and highlights the active one', async () => {
    renderAt('/devices');

    await userEvent.click(screen.getByRole('link', { name: 'Floor maps' }));

    expect(screen.getByRole('heading', { name: 'Floor maps' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Floor maps' })).toHaveAttribute('aria-current', 'page');
  });
});
