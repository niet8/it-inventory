import { type FloorMapResponse, toFloorMapResponse } from '#modules/floor-maps/application/FloorMapResponse';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';

export class ListFloorMaps {
  constructor(private readonly floorMaps: IFloorMapRepository) {}

  async execute(): Promise<FloorMapResponse[]> {
    const maps = await this.floorMaps.findAll();
    return maps.map(toFloorMapResponse);
  }
}
