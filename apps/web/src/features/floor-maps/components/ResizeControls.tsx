import { MinusIcon, PlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Side } from '@/features/floor-maps/lib/walls';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ResizeControlsProps = {
  onResize: (side: Side, delta: 1 | -1) => void;
  children: ReactNode;
};

const NOUN: Record<Side, string> = { top: 'row', bottom: 'row', left: 'column', right: 'column' };

function SideButtons({ side, onResize }: { side: Side; onResize: ResizeControlsProps['onResize'] }) {
  const vertical = side === 'left' || side === 'right';
  return (
    <div className={cn('flex justify-center gap-1', vertical ? 'flex-col' : 'flex-row')}>
      <Button
        size="icon-xs"
        variant="outline"
        aria-label={`Add ${NOUN[side]} on the ${side}`}
        onClick={() => onResize(side, 1)}
      >
        <PlusIcon aria-hidden />
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        aria-label={`Remove ${NOUN[side]} on the ${side}`}
        onClick={() => onResize(side, -1)}
      >
        <MinusIcon aria-hidden />
      </Button>
    </div>
  );
}

// Grows or shrinks the grid one strip at a time from any side.
export function ResizeControls({ onResize, children }: ResizeControlsProps) {
  return (
    <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-2">
      <span />
      <SideButtons side="top" onResize={onResize} />
      <span />
      <SideButtons side="left" onResize={onResize} />
      {children}
      <SideButtons side="right" onResize={onResize} />
      <span />
      <SideButtons side="bottom" onResize={onResize} />
      <span />
    </div>
  );
}
