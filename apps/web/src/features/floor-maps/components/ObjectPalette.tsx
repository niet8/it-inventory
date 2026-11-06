import { ObjectThumbnail } from '@/features/floor-maps/components/ObjectVisual';
import { OBJECT_TYPE_IDS, OBJECT_TYPES, type ObjectType } from '@/features/floor-maps/lib/objectTypes';
import { cn } from '@/shared/lib/utils';

type ObjectPaletteProps = {
  selected: ObjectType | null;
  onSelect: (type: ObjectType | null) => void;
};

export function ObjectPalette({ selected, onSelect }: ObjectPaletteProps) {
  return (
    <section aria-labelledby="object-palette-title" className="space-y-2">
      <h2 id="object-palette-title" className="text-xs font-medium text-muted-foreground uppercase">
        Objects
      </h2>
      <ul className="grid grid-cols-2 gap-1 lg:grid-cols-1">
        {OBJECT_TYPE_IDS.map((type) => {
          const { label, width, height } = OBJECT_TYPES[type];
          const active = selected === type;
          return (
            <li key={type}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : type)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-muted',
                  active && 'border-primary bg-muted',
                )}
              >
                <ObjectThumbnail typeId={type} />
                <span className="flex-1 truncate">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {width}×{height}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
