import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type AsyncStateProps = {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

// One place for the loading / error / empty states every list in the app goes through.
export function AsyncState({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  children,
}: AsyncStateProps) {
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading" className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;

  return <>{children}</>;
}
