import type { LayoutInput } from '#modules/floor-maps/domain/FloorMap';

// `version` is the one the client loaded; saving on top of a newer one is refused.
export type SaveLayoutCommand = LayoutInput & { id: string; version: number };
