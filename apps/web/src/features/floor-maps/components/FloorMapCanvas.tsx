import type { FloorMapObject } from '@it-inventory/contracts';
import type { MouseEvent, ReactNode } from 'react';

import type { Layout } from '@/features/floor-maps/hooks/useLayoutState';
import { CELL_SIZE, EDGE_THRESHOLD, type EditorMode } from '@/features/floor-maps/lib/editor';
import { footprintOf } from '@/features/floor-maps/lib/objectTypes';
import { edgeAt, parseWall, type Side } from '@/features/floor-maps/lib/walls';
import { cn } from '@/shared/lib/utils';

const WALL_THICKNESS = 4;

const CURSORS: Record<EditorMode, string> = {
  wall: 'cursor-crosshair',
  erase: 'cursor-cell',
  label: 'cursor-text',
  object: 'cursor-copy',
};

type FloorMapCanvasProps = {
  layout: Layout;
  mode: EditorMode;
  onCellClick: (row: number, col: number, edge: Side | null) => void;
  renderObject: (object: FloorMapObject) => ReactNode;
  // Labels and the label editor, positioned in cell units by their own component.
  overlay?: ReactNode;
};

function WallSegment({ wallKey }: { wallKey: string }) {
  const wall = parseWall(wallKey);
  if (!wall) return null;
  const horizontal = wall.kind === 'h';
  return (
    <div
      className="absolute rounded-full bg-foreground"
      style={{
        left: wall.col * CELL_SIZE - WALL_THICKNESS / 2,
        top: wall.row * CELL_SIZE - WALL_THICKNESS / 2,
        width: horizontal ? CELL_SIZE + WALL_THICKNESS : WALL_THICKNESS,
        height: horizontal ? WALL_THICKNESS : CELL_SIZE + WALL_THICKNESS,
      }}
    />
  );
}

export function FloorMapCanvas({ layout, mode, onCellClick, renderObject, overlay }: FloorMapCanvasProps) {
  const { cols, rows } = layout;
  const width = cols * CELL_SIZE;
  const height = rows * CELL_SIZE;

  // One handler for the whole grid: the cell and the edge come from the pointer position.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x / CELL_SIZE)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(y / CELL_SIZE)));
    onCellClick(row, col, edgeAt(x - col * CELL_SIZE, y - row * CELL_SIZE, CELL_SIZE, EDGE_THRESHOLD));
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: drawing on the grid is pointer-only; objects and labels are buttons.
    <div
      role="application"
      aria-label={`Floor map, ${cols} by ${rows} cells`}
      onClick={handleClick}
      className={cn('relative rounded-sm border bg-card select-none', CURSORS[mode])}
      style={{
        width,
        height,
        boxSizing: 'content-box',
        backgroundImage:
          'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
        }}
      >
        {layout.objects.map((object) => {
          const size = footprintOf(object.typeId, object.rotation);
          return (
            <div
              key={object.id}
              className="relative"
              style={{
                gridColumn: `${object.col + 1} / span ${size.width}`,
                gridRow: `${object.row + 1} / span ${size.height}`,
              }}
            >
              {renderObject(object)}
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {layout.walls.map((key) => (
          <WallSegment key={key} wallKey={key} />
        ))}
      </div>
      {overlay}
    </div>
  );
}
