// Size of one grid cell on screen, in pixels.
export const CELL_SIZE = 40;
// How close to a cell edge a click must land to draw or erase a wall there.
export const EDGE_THRESHOLD = 10;

export type EditorMode = 'wall' | 'erase' | 'label' | 'object';

export const MODE_LABELS: Record<EditorMode, string> = {
  wall: 'Walls',
  erase: 'Erase',
  label: 'Labels',
  object: 'Objects',
};

export const DEFAULT_LABEL_WIDTH = 3;
