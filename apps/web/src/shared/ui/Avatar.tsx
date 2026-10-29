import { initials } from '@/shared/lib/initials';
import { cn } from '@/shared/lib/utils';

type AvatarProps = { fullName: string; className?: string };

export function Avatar({ fullName, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={fullName}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {initials(fullName)}
    </span>
  );
}
