import { FLOOR_MAP_OBJECT_TYPES, type FloorMapObjectType } from '@it-inventory/contracts';

export type ObjectType = FloorMapObjectType;
export type Rotation = 0 | 90 | 180 | 270;
export type Footprint = { width: number; height: number };

type ObjectTypeInfo = Footprint & { label: string; assignable: boolean };

// Mirrors the API footprint table (size at rotation 0): keep both in sync.
export const OBJECT_TYPES: Record<ObjectType, ObjectTypeInfo> = {
  desk: { label: 'Desk', width: 1, height: 1, assignable: true },
  'ping-pong': { label: 'Ping-pong table', width: 2, height: 3, assignable: false },
  plant: { label: 'Plant', width: 1, height: 1, assignable: false },
  sofa: { label: 'Sofa', width: 2, height: 1, assignable: false },
  restroom: { label: 'Restroom', width: 1, height: 1, assignable: false },
  exit: { label: 'Exit', width: 1, height: 1, assignable: false },
  'meeting-room': { label: 'Meeting room', width: 2, height: 2, assignable: false },
};

export const OBJECT_TYPE_IDS: readonly ObjectType[] = FLOOR_MAP_OBJECT_TYPES;

export const isAssignable = (type: ObjectType): boolean => OBJECT_TYPES[type].assignable;

// A quarter turn swaps width and height.
export const footprintOf = (type: ObjectType, rotation: Rotation): Footprint => {
  const { width, height } = OBJECT_TYPES[type];
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
};

export const nextRotation = (rotation: Rotation): Rotation => ((rotation + 90) % 360) as Rotation;
