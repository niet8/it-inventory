import type { AssignDeskCommand } from '#modules/floor-maps/application/AssignDesk/AssignDeskCommand';
import { type FloorMapResponse, toFloorMapResponse } from '#modules/floor-maps/application/FloorMapResponse';
import type { IEmployeeLookup } from '#modules/floor-maps/domain/IEmployeeLookup';
import type { IFloorMapRepository } from '#modules/floor-maps/domain/IFloorMapRepository';
import { ConflictError, NotFoundError } from '#shared/domain/DomainError';

export class AssignDesk {
  constructor(
    private readonly floorMaps: IFloorMapRepository,
    private readonly employees: IEmployeeLookup,
  ) {}

  async execute({ mapId, objectId, employeeId }: AssignDeskCommand): Promise<FloorMapResponse> {
    const map = await this.floorMaps.findById(mapId);
    if (!map) throw new NotFoundError('Floor map', mapId);
    if (employeeId !== null && !(await this.employees.exists(employeeId))) {
      throw new NotFoundError('Employee', employeeId);
    }

    const assigned = map.assignDesk(objectId, employeeId);
    // A concurrent layout save or employee deletion can still beat this write.
    if (!(await this.floorMaps.assignDesk(mapId, objectId, employeeId))) {
      throw new ConflictError('The desk or the employee changed meanwhile; reload the floor map');
    }
    return toFloorMapResponse(assigned);
  }
}
