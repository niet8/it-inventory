import { describe, expect, it } from 'vitest';

import { FloorMap, type LayoutInput } from '#modules/floor-maps/domain/FloorMap';
import { BusinessRuleViolationError, NotFoundError, ValidationError } from '#shared/domain/DomainError';

const DESK = 'aaaaaaaa-0000-4000-8000-000000000001';
const SOFA = 'aaaaaaaa-0000-4000-8000-000000000002';
const EMPLOYEE = 'bbbbbbbb-0000-4000-8000-000000000001';

const layout = (overrides: Partial<LayoutInput> = {}): LayoutInput => ({
  cols: 10,
  rows: 8,
  walls: [],
  labels: [],
  objects: [{ id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 0 }],
  ...overrides,
});

const mapWithDesk = () => FloorMap.create({ name: 'Floor 1', cols: 10, rows: 8 }).withLayout(layout());

describe('FloorMap.create', () => {
  it('starts empty at version 0 with a trimmed name', () => {
    const map = FloorMap.create({ name: '  Floor 1 ', cols: 10, rows: 8 });

    expect(map.name).toBe('Floor 1');
    expect(map.version).toBe(0);
    expect([map.walls, map.labels, map.objects]).toEqual([[], [], []]);
    expect(map.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    [{ name: ' ', cols: 10, rows: 8 }, 'name'],
    [{ name: 'x'.repeat(81), cols: 10, rows: 8 }, 'name'],
    [{ name: 'Floor', cols: 0, rows: 8 }, 'cols'],
    [{ name: 'Floor', cols: 10, rows: 101 }, 'rows'],
    [{ name: 'Floor', cols: 2.5, rows: 8 }, 'cols'],
  ])('rejects %j', (params, field) => {
    expect(() => FloorMap.create(params)).toThrow(expect.objectContaining({ field }));
  });
});

describe('FloorMap.withLayout', () => {
  it('accepts walls on the borders and dedupes them', () => {
    const map = mapWithDesk().withLayout(layout({ walls: ['h_8_9', 'v_7_10', 'h_0_0', 'h_0_0'] }));

    expect(map.walls).toEqual(['h_8_9', 'v_7_10', 'h_0_0']);
  });

  it.each(['h_9_0', 'h_0_10', 'v_8_0', 'v_0_11', 'x_1_1', 'h_1'])('rejects wall %s', (wall) => {
    expect(() => mapWithDesk().withLayout(layout({ walls: [wall] }))).toThrow(ValidationError);
  });

  it('rejects labels outside the grid or duplicated', () => {
    const label = { id: 'l1', text: 'Kitchen', row: 7, col: 6, width: 4 };

    expect(() => mapWithDesk().withLayout(layout({ labels: [label] }))).not.toThrow();
    expect(() => mapWithDesk().withLayout(layout({ labels: [{ ...label, width: 5 }] }))).toThrow(ValidationError);
    expect(() => mapWithDesk().withLayout(layout({ labels: [{ ...label, row: 8 }] }))).toThrow(ValidationError);
    expect(() => mapWithDesk().withLayout(layout({ labels: [label, label] }))).toThrow(/duplicated/);
  });

  it('uses the rotated footprint to check the grid bounds', () => {
    const pingPong = { id: SOFA, typeId: 'ping-pong', row: 6, col: 0, rotation: 90 };

    expect(() => mapWithDesk().withLayout(layout({ objects: [pingPong] }))).not.toThrow();
    expect(() => mapWithDesk().withLayout(layout({ objects: [{ ...pingPong, rotation: 0 }] }))).toThrow(/does not fit/);
  });

  it('rejects overlapping objects', () => {
    const objects = [
      { id: DESK, typeId: 'desk', row: 1, col: 2, rotation: 0 },
      { id: SOFA, typeId: 'meeting-room', row: 0, col: 1, rotation: 0 },
    ];

    expect(() => mapWithDesk().withLayout(layout({ objects }))).toThrow(BusinessRuleViolationError);
  });

  it.each([
    [{ id: DESK, typeId: 'motorbike', row: 0, col: 0, rotation: 0 }, /Unknown object type/],
    [{ id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 45 }, /Rotation 45/],
    [{ id: DESK, typeId: 'desk', row: -1, col: 0, rotation: 0 }, /does not fit/],
  ])('rejects invalid object %j', (object, message) => {
    expect(() => mapWithDesk().withLayout(layout({ objects: [object] }))).toThrow(message);
  });

  it('rejects duplicated object ids', () => {
    const objects = [
      { id: DESK, typeId: 'desk', row: 0, col: 0, rotation: 0 },
      { id: DESK, typeId: 'desk', row: 3, col: 3, rotation: 0 },
    ];

    expect(() => mapWithDesk().withLayout(layout({ objects }))).toThrow(/duplicated/);
  });

  it('keeps desk assignments by id and drops them when the object stops being a desk', () => {
    const assigned = mapWithDesk().assignDesk(DESK, EMPLOYEE);

    const moved = assigned.withLayout(layout({ objects: [{ id: DESK, typeId: 'desk', row: 4, col: 4, rotation: 0 }] }));
    const retyped = assigned.withLayout(
      layout({ objects: [{ id: DESK, typeId: 'plant', row: 0, col: 0, rotation: 0 }] }),
    );

    expect(moved.objects[0]).toMatchObject({ row: 4, col: 4, employeeId: EMPLOYEE });
    expect(retyped.objects[0]?.employeeId).toBeNull();
  });

  it('leaves the original instance untouched', () => {
    const original = mapWithDesk();

    original.withLayout(layout({ cols: 20, objects: [] }));

    expect(original.cols).toBe(10);
    expect(original.objects).toHaveLength(1);
  });
});

describe('FloorMap.assignDesk and rename', () => {
  it('assigns and frees a desk', () => {
    const assigned = mapWithDesk().assignDesk(DESK, EMPLOYEE);

    expect(assigned.objects[0]?.employeeId).toBe(EMPLOYEE);
    expect(assigned.assignDesk(DESK, null).objects[0]?.employeeId).toBeNull();
  });

  it('refuses unknown objects and non-desk objects', () => {
    const map = mapWithDesk().withLayout(
      layout({ objects: [{ id: SOFA, typeId: 'sofa', row: 0, col: 0, rotation: 0 }] }),
    );

    expect(() => map.assignDesk(DESK, EMPLOYEE)).toThrow(NotFoundError);
    expect(() => map.assignDesk(SOFA, EMPLOYEE)).toThrow(BusinessRuleViolationError);
  });

  it('renames keeping the rest of the map', () => {
    const renamed = mapWithDesk().rename(' Floor 2 ');

    expect(renamed.name).toBe('Floor 2');
    expect(renamed.objects).toHaveLength(1);
    expect(() => renamed.rename('')).toThrow(ValidationError);
  });
});
