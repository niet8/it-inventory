import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { routes } from '@/app/routes';

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};

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
