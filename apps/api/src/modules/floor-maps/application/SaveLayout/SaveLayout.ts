import { type FloorMapResponse, toFloorMapResponse } from '#modules/floor-maps/application/FloorMapResponse';
import type { SaveLayoutCommand } from '#modules/floor-maps/application/SaveLayout/SaveLayoutCommand';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { ConflictError, NotFoundError } from '#shared/domain/DomainError';

const staleLayout = () => new ConflictError('The floor map was changed somewhere else; reload it before saving');

export class SaveLayout {
  constructor(private readonly floorMaps: IFloorMapRepository) {}

  async execute(command: SaveLayoutCommand): Promise<FloorMapResponse> {
    const map = await this.floorMaps.findById(command.id);
    if (!map) throw new NotFoundError('Floor map', command.id);
    if (map.version !== command.version) throw staleLayout();

    // The repository repeats the version check atomically, closing the gap between read and write.
    const saved = await this.floorMaps.saveLayout(map.withLayout(command), command.version);
    if (!saved) throw staleLayout();
    return toFloorMapResponse(saved);
  }
}
