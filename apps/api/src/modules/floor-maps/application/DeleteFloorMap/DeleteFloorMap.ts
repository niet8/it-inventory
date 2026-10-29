import type { DeleteFloorMapCommand } from '#modules/floor-maps/application/DeleteFloorMap/DeleteFloorMapCommand';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { NotFoundError } from '#shared/domain/DomainError';

export class DeleteFloorMap {
  constructor(private readonly floorMaps: IFloorMapRepository) {}

  async execute({ id }: DeleteFloorMapCommand): Promise<void> {
    if (!(await this.floorMaps.delete(id))) throw new NotFoundError('Floor map', id);
  }
}
