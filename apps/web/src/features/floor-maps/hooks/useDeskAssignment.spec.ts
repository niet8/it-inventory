import type { FloorMapObject } from '@it-inventory/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDeskAssignment } from '@/features/floor-maps/hooks/useDeskAssignment';
import { ApiError } from '@/shared/api/httpClient';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const desk: FloorMapObject = { id: 'd1', typeId: 'desk', row: 0, col: 0, rotation: 0, employeeId: 'e1' };

const setup = (assign: ReturnType<typeof vi.fn>) => {
  const dispatch = vi.fn();
  const beforeAssign = vi.fn(async () => {});
  const { result } = renderHook(() =>
    useDeskAssignment({ mapId: 'm1', objects: [desk], dispatch, beforeAssign, assign: assign as never }),
  );
  return { dispatch, beforeAssign, assignDesk: result.current };
};

describe('useDeskAssignment', () => {
  it('applies the assignment before the request and keeps it on success', async () => {
    const assign = vi.fn(async () => ({}));
    const { dispatch, beforeAssign, assignDesk } = setup(assign);

    await act(() => assignDesk('d1', 'e2'));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'assign', objectId: 'd1', employeeId: 'e2' });
    expect(beforeAssign).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('m1', 'd1', 'e2');
  });

  it('rolls back to the previous employee when the server refuses', async () => {
    const assign = vi.fn(async () => {
      throw new ApiError('Employee not found', 404);
    });
    const { dispatch, assignDesk } = setup(assign);

    await act(() => assignDesk('d1', null));

    expect(dispatch.mock.calls.map(([action]) => action.employeeId)).toEqual([null, 'e1']);
  });

  it('does nothing when the desk already has that employee', async () => {
    const assign = vi.fn(async () => ({}));
    const { dispatch, assignDesk } = setup(assign);

    await act(() => assignDesk('d1', 'e1'));

    expect(dispatch).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});
