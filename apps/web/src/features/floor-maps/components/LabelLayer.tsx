import type { FloorMapLabel } from '@it-inventory/contracts';
import { XIcon } from 'lucide-react';
import { type MouseEvent, useRef, useState } from 'react';

import { CELL_SIZE, type EditorMode } from '@/features/floor-maps/lib/editor';
import { cn } from '@/shared/lib/utils';

export type LabelDraft = { id: string | null; row: number; col: number; width: number; text: string };

type LabelLayerProps = {
  labels: FloorMapLabel[];
  mode: EditorMode;
  draft: LabelDraft | null;
  onEdit: (label: FloorMapLabel) => void;
  onRemove: (id: string) => void;
  onCommit: (draft: LabelDraft) => void;
  onCancel: () => void;
};

const MAX_LABEL_LENGTH = 60;

const position = ({ row, col, width }: { row: number; col: number; width: number }) => ({
  top: row * CELL_SIZE,
  left: col * CELL_SIZE,
  width: width * CELL_SIZE,
  height: CELL_SIZE,
});

function LabelInput({
  draft,
  onCommit,
  onCancel,
}: Pick<LabelLayerProps, 'onCommit' | 'onCancel'> & { draft: LabelDraft }) {
  const [text, setText] = useState(draft.text);
  // Enter and the blur that follows must not commit twice.
  const settled = useRef(false);
  const settle = (action: () => void) => {
    if (settled.current) return;
    settled.current = true;
    action();
  };
  const commit = () => settle(() => onCommit({ ...draft, text }));
  const cancel = () => settle(onCancel);
  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: the field appears because the user just clicked where the label goes.
      autoFocus
      aria-label="Label text"
      placeholder="Area name"
      maxLength={MAX_LABEL_LENGTH}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') cancel();
      }}
      className="pointer-events-auto absolute z-20 rounded-sm border bg-background px-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      style={position(draft)}
    />
  );
}

// Area names drawn over the grid. Clicking one edits it in label mode and removes it in erase mode.
export function LabelLayer({ labels, mode, draft, onEdit, onRemove, onCommit, onCancel }: LabelLayerProps) {
  const handleClick = (label: FloorMapLabel) => (event: MouseEvent) => {
    if (mode !== 'label' && mode !== 'erase') return;
    event.stopPropagation();
    if (mode === 'erase') onRemove(label.id);
    else onEdit(label);
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {labels
        .filter((label) => label.id !== draft?.id)
        .map((label) => (
          <div
            key={label.id}
            className={cn(
              'group absolute flex items-center justify-center px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase',
              (mode === 'label' || mode === 'erase') && 'pointer-events-auto cursor-pointer hover:bg-muted/60',
            )}
            style={position(label)}
          >
            <button type="button" className="truncate" onClick={handleClick(label)}>
              {label.text}
            </button>
            {mode === 'label' && (
              <button
                type="button"
                aria-label={`Remove label ${label.text}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(label.id);
                }}
                className="ml-1 hidden rounded-full p-0.5 group-hover:inline-flex hover:bg-destructive/10"
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            )}
          </div>
        ))}
      {draft && (
        <LabelInput
          key={draft.id ?? `${draft.row}:${draft.col}`}
          draft={draft}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
