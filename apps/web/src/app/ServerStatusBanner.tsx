import { useQuery } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { apiRequest } from '@/shared/api/httpClient';

// The free hosting tier puts the API to sleep when idle; waking it up takes ~30 s.
const SLOW_AFTER_MS = 2_500;
const RETRY_EVERY_MS = 3_000;
const MAX_RETRIES = 20;

export function ServerStatusBanner() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiRequest<{ status: string }>('/health', { signal }),
    retry: MAX_RETRIES,
    retryDelay: RETRY_EVERY_MS,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!health.isPending) return;
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [health.isPending]);

  if (health.isSuccess || !isSlow) return null;

  if (health.isError) {
    return (
      <p role="alert" className="border-b bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        The demo server is not responding. Please try again in a few minutes.
      </p>
    );
  }

  return (
    <p role="status" className="flex items-center justify-center gap-2 border-b bg-muted px-4 py-2 text-sm">
      <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
      Waking up the demo server — free hosting sleeps when idle, this can take about 30 seconds.
    </p>
  );
}
