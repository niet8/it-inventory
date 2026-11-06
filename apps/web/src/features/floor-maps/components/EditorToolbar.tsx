import {
  BrickWallIcon,
  CheckIcon,
  CloudAlertIcon,
  EraserIcon,
  LoaderCircleIcon,
  type LucideIcon,
  RotateCwIcon,
  ShapesIcon,
  TrashIcon,
  TypeIcon,
  Undo2Icon,
} from 'lucide-react';

import type { AutosaveStatus } from '@/features/floor-maps/hooks/useAutosave';
import { type EditorMode, MODE_LABELS } from '@/features/floor-maps/lib/editor';
import type { Rotation } from '@/features/floor-maps/lib/objectTypes';
import { Button } from '@/shared/ui/button';

const MODE_ICONS: Record<EditorMode, LucideIcon> = {
  wall: BrickWallIcon,
  erase: EraserIcon,
  label: TypeIcon,
  object: ShapesIcon,
};

const STATUS: Record<AutosaveStatus, { text: string; icon: LucideIcon; spin?: boolean }> = {
  idle: { text: 'All changes saved', icon: CheckIcon },
  pending: { text: 'Unsaved changes', icon: LoaderCircleIcon },
  saving: { text: 'Saving…', icon: LoaderCircleIcon, spin: true },
  error: { text: 'Not saved', icon: CloudAlertIcon },
};

type EditorToolbarProps = {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  rotation: Rotation;
  onRotate: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onClearWalls: () => void;
  status: AutosaveStatus;
};

export function EditorToolbar({
  mode,
  onModeChange,
  rotation,
  onRotate,
  canUndo,
  onUndo,
  onClearWalls,
  status,
}: EditorToolbarProps) {
  const { text, icon: StatusIcon, spin } = STATUS[status];
  return (
    <div role="toolbar" aria-label="Editor tools" className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg border p-0.5">
        {(Object.keys(MODE_LABELS) as EditorMode[]).map((value) => {
          const Icon = MODE_ICONS[value];
          return (
            <Button
              key={value}
              size="sm"
              variant={mode === value ? 'secondary' : 'ghost'}
              aria-pressed={mode === value}
              onClick={() => onModeChange(value)}
            >
              <Icon aria-hidden />
              {MODE_LABELS[value]}
            </Button>
          );
        })}
      </div>
      {mode === 'object' && (
        <Button size="sm" variant="outline" onClick={onRotate} title="Rotate (R)">
          <RotateCwIcon aria-hidden />
          Rotate {rotation}°
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2Icon aria-hidden />
        Undo
      </Button>
      <Button size="sm" variant="ghost" onClick={onClearWalls}>
        <TrashIcon aria-hidden />
        Clear walls
      </Button>
      <span role="status" className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <StatusIcon className={spin ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
        {text}
      </span>
    </div>
  );
}
