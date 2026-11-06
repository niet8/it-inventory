import { describe, expect, it } from 'vitest';

import { buildOfficeLayout, DEVICE_BATCHES, EMPLOYEES, FLOOR_MAP } from '#apps/seed/demo-data';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';

describe('demo data', () => {
  it('builds an office layout that passes every floor map rule', () => {
    const { deskIds, ...layout } = buildOfficeLayout();

    const map = FloorMap.create(FLOOR_MAP).withLayout(layout);

    expect(map.objects).toHaveLength(layout.objects.length);
    expect(deskIds.length).toBeGreaterThanOrEqual(EMPLOYEES.length);
  });

  it('only uses fictional example.com addresses and unique ones', () => {
    const emails = EMPLOYEES.map((employee) => employee.email);

    expect(emails.every((email) => email.endsWith('@example.com'))).toBe(true);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('has enough devices to assign and retire', () => {
    expect(DEVICE_BATCHES.reduce((total, batch) => total + batch.count, 0)).toBeGreaterThan(20);
  });
});
