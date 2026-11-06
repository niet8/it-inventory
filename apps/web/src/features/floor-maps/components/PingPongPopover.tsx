import { Gamepad2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import type { useHoverPopover } from '@/features/floor-maps/hooks/useHoverPopover';
import { buttonVariants } from '@/shared/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover';

type PingPongPopoverProps = { hover: ReturnType<typeof useHoverPopover>; children: ReactNode };

// The easter egg: the table on the map opens the Pong page.
export function PingPongPopover({ hover, children }: PingPongPopoverProps) {
  return (
    <Popover open={hover.open && hover.pinned} onOpenChange={(open) => !open && hover.close()}>
      <PopoverAnchor asChild>
        <div className="size-full">{children}</div>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        className="w-56 items-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <Gamepad2Icon className="size-6 text-muted-foreground" aria-hidden />
        <p className="font-medium">Ping-pong table</p>
        <p className="text-xs text-muted-foreground">Fancy a quick game?</p>
        <Link to="/pong" className={buttonVariants({ size: 'sm' })}>
          Play Pong
        </Link>
      </PopoverContent>
    </Popover>
  );
}
