import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FloorMapCanvas } from '@/features/floor-maps/components/FloorMapCanvas';
import { CELL_SIZE } from '@/features/floor-maps/lib/editor';

const layout = { cols: 4, rows: 3, walls: ['h_0_0', 'v_2_4'], labels: [], objects: [] };

describe('FloorMapCanvas', () => {
  it('translates a click into the cell and the nearby edge', () => {
    const onCellClick = vi.fn();
    render(<FloorMapCanvas layout={layout} mode="wall" onCellClick={onCellClick} renderObject={() => null} />);
    const grid = screen.getByRole('application', { name: 'Floor map, 4 by 3 cells' });

    // jsdom places the grid at (0, 0).
    fireEvent.click(grid, { clientX: CELL_SIZE * 2 + 20, clientY: 3 });
    expect(onCellClick).toHaveBeenLastCalledWith(0, 2, 'top');

    fireEvent.click(grid, { clientX: CELL_SIZE + 20, clientY: CELL_SIZE * 2 + 20 });
    expect(onCellClick).toHaveBeenLastCalledWith(2, 1, null);

    fireEvent.click(grid, { clientX: CELL_SIZE * 4 - 2, clientY: CELL_SIZE + 20 });
    expect(onCellClick).toHaveBeenLastCalledWith(1, 3, 'right');
  });

  it('renders each object inside its rotated footprint', () => {
    render(
      <FloorMapCanvas
        layout={{
          ...layout,
          objects: [{ id: 'o', typeId: 'sofa', row: 1, col: 2, rotation: 90, employeeId: null }],
        }}
        mode="wall"
        onCellClick={() => {}}
        renderObject={(object) => <span>{object.typeId}</span>}
      />,
    );
    const slot = screen.getByText('sofa').parentElement;
    expect(slot?.style.gridColumn).toBe('3 / span 1');
    expect(slot?.style.gridRow).toBe('2 / span 2');
  });
});
