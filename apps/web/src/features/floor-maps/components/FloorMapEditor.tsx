import type { FloorMap } from '@it-inventory/contracts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { fetchEmployees, floorMapKeys } from '@/features/floor-maps/api/floorMapsApi';
import { EditorToolbar } from '@/features/floor-maps/components/EditorToolbar';
import { FloorMapCanvas } from '@/features/floor-maps/components/FloorMapCanvas';
import { type LabelDraft, LabelLayer } from '@/features/floor-maps/components/LabelLayer';
import { MapObjectSlot } from '@/features/floor-maps/components/MapObjectSlot';
import { ObjectPalette } from '@/features/floor-maps/components/ObjectPalette';
import { ResizeControls } from '@/features/floor-maps/components/ResizeControls';
import { useEditorShortcuts } from '@/features/floor-maps/hooks/useEditorShortcuts';
import { useFloorMapEditor } from '@/features/floor-maps/hooks/useFloorMapEditor';
import { PLACEMENT_MESSAGES, type PlacementError } from '@/features/floor-maps/lib/collision';
import { DEFAULT_LABEL_WIDTH, type EditorMode } from '@/features/floor-maps/lib/editor';
import { nextRotation, type ObjectType, type Rotation } from '@/features/floor-maps/lib/objectTypes';
import { cellEdgeKey, type Side } from '@/features/floor-maps/lib/walls';
import { Input } from '@/shared/ui/input';

type FloorMapEditorProps = {
  map: FloorMap;
  patchMap: (id: string, update: (map: FloorMap) => FloorMap | null) => void;
  fetchFresh: (id: string) => Promise<FloorMap | null>;
};

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const report = (error: PlacementError | null) => error && toast.error(PLACEMENT_MESSAGES[error]);

export function FloorMapEditor(props: FloorMapEditorProps) {
  const { layout, dispatch, canUndo, placeObject, rotateObject, autosave, assign } = useFloorMapEditor(props);
  const [mode, setMode] = useState<EditorMode>('wall');
  const [objectType, setObjectType] = useState<ObjectType>('desk');
  const [rotation, setRotation] = useState<Rotation>(0);
  const [labelDraft, setLabelDraft] = useState<LabelDraft | null>(null);
  const [search, setSearch] = useState('');

  const { data: directory } = useQuery({
    queryKey: floorMapKeys.employees(''),
    queryFn: ({ signal }) => fetchEmployees('', signal),
  });
  const employees = useMemo(() => new Map(directory?.items.map((employee) => [employee.id, employee])), [directory]);

  const changeMode = (next: EditorMode) => {
    setMode(next);
    setLabelDraft(null);
  };

  useEditorShortcuts({
    onEscape: () => changeMode('wall'),
    onRotate: () => mode === 'object' && setRotation(nextRotation),
    onUndo: () => dispatch({ type: 'undo' }),
  });

  const handleCellClick = (row: number, col: number, edge: Side | null) => {
    if (mode === 'wall' && edge) dispatch({ type: 'toggleWall', key: cellEdgeKey(row, col, edge) });
    if (mode === 'erase' && edge) dispatch({ type: 'removeWall', key: cellEdgeKey(row, col, edge) });
    if (mode === 'label') {
      setLabelDraft({ id: null, row, col, width: Math.min(DEFAULT_LABEL_WIDTH, layout.cols - col), text: '' });
    }
    if (mode === 'object') report(placeObject({ id: crypto.randomUUID(), typeId: objectType, row, col, rotation }));
  };

  const commitLabel = ({ id, text, ...position }: LabelDraft) => {
    setLabelDraft(null);
    const trimmed = text.trim();
    if (trimmed)
      dispatch({ type: 'upsertLabel', label: { id: id ?? crypto.randomUUID(), text: trimmed, ...position } });
    else if (id) dispatch({ type: 'removeLabel', id });
  };

  const term = normalize(search.trim());
  const matches = (employeeId: string | null) => {
    const name = employeeId ? employees.get(employeeId)?.fullName : undefined;
    return Boolean(term && name && normalize(name).includes(term));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
      <aside className="space-y-4">
        <ObjectPalette
          selected={mode === 'object' ? objectType : null}
          onSelect={(type) => {
            if (type) setObjectType(type);
            changeMode(type ? 'object' : 'wall');
          }}
        />
        <div className="space-y-2">
          <label htmlFor="desk-search" className="text-xs font-medium text-muted-foreground uppercase">
            Find a person
          </label>
          <Input
            id="desk-search"
            placeholder="Name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="text-base md:text-sm"
          />
        </div>
      </aside>
      <section className="min-w-0 space-y-3">
        <EditorToolbar
          mode={mode}
          onModeChange={changeMode}
          rotation={rotation}
          onRotate={() => setRotation(nextRotation)}
          canUndo={canUndo}
          onUndo={() => dispatch({ type: 'undo' })}
          onClearWalls={() => dispatch({ type: 'clearWalls' })}
          status={autosave.status}
        />
        <div className="overflow-auto rounded-lg border bg-muted/30 p-4">
          <ResizeControls onResize={(side, delta) => dispatch({ type: 'resize', side, delta })}>
            <FloorMapCanvas
              layout={layout}
              mode={mode}
              onCellClick={handleCellClick}
              renderObject={(object) => (
                <MapObjectSlot
                  object={object}
                  mode={mode}
                  employee={(object.employeeId && employees.get(object.employeeId)) || null}
                  highlighted={matches(object.employeeId)}
                  onAssign={(objectId, employeeId) => void assign(objectId, employeeId)}
                  onRotate={(id) => report(rotateObject(id))}
                  onRemove={(id) => dispatch({ type: 'removeObject', id })}
                />
              )}
              overlay={
                <LabelLayer
                  labels={layout.labels}
                  mode={mode}
                  draft={labelDraft}
                  onEdit={(label) => setLabelDraft(label)}
                  onRemove={(id) => dispatch({ type: 'removeLabel', id })}
                  onCommit={commitLabel}
                  onCancel={() => setLabelDraft(null)}
                />
              }
            />
          </ResizeControls>
        </div>
        <p className="text-xs text-muted-foreground">
          Click near a cell edge to draw or erase a wall. Changes are saved automatically.
        </p>
      </section>
    </div>
  );
}
