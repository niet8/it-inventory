import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AsyncState } from '@/shared/ui/AsyncState';

describe('AsyncState', () => {
  it('shows a loading placeholder instead of the content', () => {
    render(
      <AsyncState isLoading error={null}>
        content
      </AsyncState>,
    );

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error message and retries on demand', async () => {
    const onRetry = vi.fn();
    render(
      <AsyncState isLoading={false} error={new Error('Cannot reach the server')} onRetry={onRetry}>
        content
      </AsyncState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the server');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty message or the content', () => {
    const { rerender } = render(
      <AsyncState isLoading={false} error={null} isEmpty emptyMessage="No devices yet.">
        content
      </AsyncState>,
    );
    expect(screen.getByText('No devices yet.')).toBeInTheDocument();

    rerender(
      <AsyncState isLoading={false} error={null}>
        content
      </AsyncState>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
