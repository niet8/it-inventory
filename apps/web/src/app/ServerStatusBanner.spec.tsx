import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerStatusBanner } from '@/app/ServerStatusBanner';

const renderBanner = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ServerStatusBanner />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ServerStatusBanner', () => {
  it('stays hidden when the server answers quickly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'OK', data: { status: 'up' } }))),
    );
    renderBanner();

    await act(() => vi.advanceTimersByTimeAsync(5_000));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains the cold start while the server is still waking up', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    renderBanner();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(screen.getByRole('status')).toHaveTextContent('Waking up the demo server');
  });
});
