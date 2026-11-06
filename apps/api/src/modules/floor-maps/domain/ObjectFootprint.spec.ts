import { describe, expect, it } from 'vitest';

import { footprintOf, isAssignable, isObjectType, isRotation } from '#modules/floor-maps/domain/ObjectFootprint';

describe('ObjectFootprint', () => {
  it('swaps width and height when rotated a quarter turn', () => {
    expect(footprintOf('ping-pong', 0)).toEqual({ width: 2, height: 3 });
    expect(footprintOf('ping-pong', 180)).toEqual({ width: 2, height: 3 });
    expect(footprintOf('ping-pong', 90)).toEqual({ width: 3, height: 2 });
    expect(footprintOf('sofa', 270)).toEqual({ width: 1, height: 2 });
  });

  it('recognises known types and rotations only', () => {
    expect(isObjectType('meeting-room')).toBe(true);
    expect(isObjectType('motorbike')).toBe(false);
    expect(isObjectType('toString')).toBe(false);
    expect(isRotation(270)).toBe(true);
    expect(isRotation(45)).toBe(false);
  });

  it('only lets desks be assigned', () => {
    expect(isAssignable('desk')).toBe(true);
    expect(isAssignable('sofa')).toBe(false);
  });
});
