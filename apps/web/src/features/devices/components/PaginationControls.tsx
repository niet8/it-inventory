import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';

type PaginationControlsProps = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, limit, total, onPageChange }: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount === 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2 text-sm">
      <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeftIcon aria-hidden />
        <span className="sr-only">Previous page</span>
      </Button>
      <span className="tabular-nums text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
        <ChevronRightIcon aria-hidden />
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  );
}
