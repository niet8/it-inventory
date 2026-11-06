import { randomUUID } from 'node:crypto';

import type { LayoutInput } from '#modules/floor-maps/domain/FloorMap';

// Fictional people and equipment for the public demo. Every email uses the reserved example.com domain.
export const EMPLOYEES = [
  { fullName: 'Alex Morgan', email: 'alex.morgan@example.com', department: 'Engineering' },
  { fullName: 'Sam Rivera', email: 'sam.rivera@example.com', department: 'Engineering' },
  { fullName: 'Jordan Lee', email: 'jordan.lee@example.com', department: 'Engineering' },
  { fullName: 'Taylor Brooks', email: 'taylor.brooks@example.com', department: 'Engineering' },
  { fullName: 'Casey Nguyen', email: 'casey.nguyen@example.com', department: 'Design' },
  { fullName: 'Riley Santos', email: 'riley.santos@example.com', department: 'Design' },
  { fullName: 'Morgan Patel', email: 'morgan.patel@example.com', department: 'Sales' },
  { fullName: 'Jamie Fischer', email: 'jamie.fischer@example.com', department: 'Sales' },
  { fullName: 'Avery Kim', email: 'avery.kim@example.com', department: 'Operations' },
  { fullName: 'Quinn Dubois', email: 'quinn.dubois@example.com', department: 'Finance' },
];

export const DEVICE_BATCHES = [
  { name: 'Laptop 14"', codePrefix: 'LAP', count: 12 },
  { name: 'Monitor 27"', codePrefix: 'MON', count: 10 },
  { name: 'Phone', codePrefix: 'PHN', count: 6 },
  { name: 'Docking station', codePrefix: null, count: 4 },
];

// How many devices of the batch list (in order) go to employees, and how many are retired.
export const ASSIGNED_DEVICES = 18;
export const DECOMMISSIONED_DEVICES = 2;

const COLS = 16;
const ROWS = 10;

const outerWalls = (): string[] => {
  const walls: string[] = [];
  for (let col = 0; col < COLS; col++) walls.push(`h_0_${col}`, `h_${ROWS}_${col}`);
  for (let row = 0; row < ROWS; row++) walls.push(`v_${row}_0`, `v_${row}_${COLS}`);
  // Wall between the open space and the meeting room.
  for (let row = 5; row < 8; row++) walls.push(`v_${row}_10`);
  return walls;
};

const object = (typeId: string, row: number, col: number, rotation = 0) => ({
  id: randomUUID(),
  typeId,
  row,
  col,
  rotation,
});

export const buildOfficeLayout = (): LayoutInput & { deskIds: string[] } => {
  const desks = [2, 4].flatMap((row) => [2, 3, 4, 5, 6, 7].map((col) => object('desk', row, col)));
  return {
    cols: COLS,
    rows: ROWS,
    walls: outerWalls(),
    labels: [
      { id: randomUUID(), text: 'Open space', row: 1, col: 2, width: 6 },
      { id: randomUUID(), text: 'Lounge', row: 6, col: 2, width: 4 },
    ],
    objects: [
      ...desks,
      object('ping-pong', 2, 12),
      object('meeting-room', 6, 12),
      object('sofa', 7, 2),
      object('plant', 8, 14),
      object('restroom', 8, 0),
      object('exit', 9, 15),
    ],
    deskIds: desks.map((desk) => desk.id),
  };
};

export const FLOOR_MAP = { name: 'Head office', cols: COLS, rows: ROWS };
