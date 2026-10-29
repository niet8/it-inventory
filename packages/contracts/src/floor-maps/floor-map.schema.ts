import { z } from 'zod';

export const FLOOR_MAP_OBJECT_TYPES = [
  'desk',
  'ping-pong',
  'plant',
  'sofa',
  'restroom',
  'exit',
  'meeting-room',
] as const;
export const FloorMapObjectTypeSchema = z.enum(FLOOR_MAP_OBJECT_TYPES);

const GridSize = z.number().int().min(1).max(100);
const Cell = z.number().int().min(0).max(99);
const Name = z.string().trim().min(1).max(80);

// Wall keys address a cell edge: `h_<row>_<col>` (horizontal) or `v_<row>_<col>` (vertical).
const WallKey = z.string().regex(/^[hv]_\d{1,3}_\d{1,3}$/);

const LabelSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().min(1).max(60),
  row: Cell,
  col: Cell,
  width: GridSize,
});

const LayoutObjectSchema = z.object({
  id: z.uuid(),
  typeId: FloorMapObjectTypeSchema,
  row: Cell,
  col: Cell,
  rotation: z.literal([0, 90, 180, 270]),
});

export const FloorMapObjectSchema = LayoutObjectSchema.extend({ employeeId: z.uuid().nullable() });

export const FloorMapSchema = z.object({
  id: z.uuid(),
  name: Name,
  cols: GridSize,
  rows: GridSize,
  walls: z.array(WallKey),
  labels: z.array(LabelSchema),
  objects: z.array(FloorMapObjectSchema),
  version: z.number().int().min(0),
});

export const CreateFloorMapBodySchema = z.object({
  name: Name,
  cols: GridSize.default(10),
  rows: GridSize.default(8),
});

export const RenameFloorMapBodySchema = z.object({ name: Name });

// Structural autosave: desk assignments are never part of it, so a stale tab can't overwrite them.
// `version` must match the stored one; otherwise the API answers 409 and the client reloads.
export const SaveLayoutBodySchema = z.object({
  version: z.number().int().min(0),
  cols: GridSize,
  rows: GridSize,
  walls: z.array(WallKey).max(20_000),
  labels: z.array(LabelSchema).max(500),
  objects: z.array(LayoutObjectSchema).max(2_000),
});

// `null` frees the desk.
export const AssignDeskBodySchema = z.object({ employeeId: z.uuid().nullable() });

export type FloorMapObjectType = z.infer<typeof FloorMapObjectTypeSchema>;
export type FloorMapLabel = z.infer<typeof LabelSchema>;
export type FloorMapObject = z.infer<typeof FloorMapObjectSchema>;
export type FloorMap = z.infer<typeof FloorMapSchema>;
export type CreateFloorMapBody = z.input<typeof CreateFloorMapBodySchema>;
export type RenameFloorMapBody = z.infer<typeof RenameFloorMapBodySchema>;
export type SaveLayoutBody = z.infer<typeof SaveLayoutBodySchema>;
export type AssignDeskBody = z.infer<typeof AssignDeskBodySchema>;
