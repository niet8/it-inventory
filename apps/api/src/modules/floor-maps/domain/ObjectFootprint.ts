// Size of each object type in grid cells at rotation 0; 90 and 270 swap width and height.
// The web editor mirrors this table: keep both in sync.
export const OBJECT_FOOTPRINTS = {
  desk: { width: 1, height: 1 },
  'ping-pong': { width: 2, height: 3 },
  plant: { width: 1, height: 1 },
  sofa: { width: 2, height: 1 },
  restroom: { width: 1, height: 1 },
  exit: { width: 1, height: 1 },
  'meeting-room': { width: 2, height: 2 },
} as const;

export type ObjectType = keyof typeof OBJECT_FOOTPRINTS;

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

// Only desks can be given to an employee; every other object is decorative.
export const ASSIGNABLE_TYPES: readonly ObjectType[] = ['desk'];

export const isObjectType = (value: string): value is ObjectType => Object.hasOwn(OBJECT_FOOTPRINTS, value);

export const isRotation = (value: number): value is Rotation => (ROTATIONS as readonly number[]).includes(value);

export const isAssignable = (type: ObjectType): boolean => ASSIGNABLE_TYPES.includes(type);

export const footprintOf = (type: ObjectType, rotation: Rotation): { width: number; height: number } => {
  const { width, height } = OBJECT_FOOTPRINTS[type];
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
};
