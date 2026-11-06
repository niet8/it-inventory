import type { CreateFloorMapCommand } from '#modules/floor-maps/application/CreateFloorMap/CreateFloorMapCommand';
import { type FloorMapResponse, toFloorMapResponse } from '#modules/floor-maps/application/FloorMapResponse';
import { FloorMap } from '#modules/floor-maps/domain/FloorMap';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';

export class CreateFloorMap {
  constructor(private readonly floorMaps: IFloorMapRepository) {}

  async execute(command: CreateFloorMapCommand): Promise<FloorMapResponse> {
    const map = FloorMap.create(command);
    await this.floorMaps.create(map);
    return toFloorMapResponse(map);
  }
}
