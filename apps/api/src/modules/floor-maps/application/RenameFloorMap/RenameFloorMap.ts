import { type FloorMapResponse, toFloorMapResponse } from '#modules/floor-maps/application/FloorMapResponse';
import type { RenameFloorMapCommand } from '#modules/floor-maps/application/RenameFloorMap/RenameFloorMapCommand';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { NotFoundError } from '#shared/domain/DomainError';

export class RenameFloorMap {
  constructor(private readonly floorMaps: IFloorMapRepository) {}

  async execute({ id, name }: RenameFloorMapCommand): Promise<FloorMapResponse> {
    const map = await this.floorMaps.findById(id);
    if (!map) throw new NotFoundError('Floor map', id);

    const renamed = map.rename(name);
    if (!(await this.floorMaps.updateName(renamed))) throw new NotFoundError('Floor map', id);
    return toFloorMapResponse(renamed);
  }
}
