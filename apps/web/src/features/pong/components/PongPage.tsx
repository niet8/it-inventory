import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router';

import { PongCanvas } from '@/features/pong/components/PongCanvas';
import { WINNING_SCORE } from '@/features/pong/hooks/usePongGame';
import { buttonVariants } from '@/shared/ui/button';

export function PongPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[800px] items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pong</h1>
        <Link to="/floor-maps" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeftIcon aria-hidden />
          Back to the map
        </Link>
      </div>
      <PongCanvas />
      <p className="text-sm text-muted-foreground">
        W / S or ↑ / ↓ to move · Space to start · First to {WINNING_SCORE}
      </p>
    </div>
  );
}
