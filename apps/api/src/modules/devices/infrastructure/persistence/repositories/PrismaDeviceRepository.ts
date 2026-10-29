import { Prisma } from '#generated/prisma/client';
import type { Device, DeviceStatus } from '#modules/devices/domain/Device';
import type {
  DeviceCounts,
  DeviceListQuery,
  DevicePage,
  IDeviceRepository,
} from '#modules/devices/domain/IDeviceRepository';
import { DeviceMapper } from '#modules/devices/infrastructure/persistence/mappers/DeviceMapper';
import { ConflictError, NotFoundError } from '#shared/domain/DomainError';
import type { Database } from '#shared/infrastructure/persistence/prisma-client';

const UNIQUE_VIOLATION = 'P2002';
const FOREIGN_KEY_VIOLATION = 'P2003';
const RECORD_NOT_FOUND = 'P2025';

const prismaCode = (error: unknown): string | undefined =>
  error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;

// Same rule as Device.status, expressed as a query.
const WHERE_STATUS: Record<DeviceStatus, Prisma.DeviceWhereInput> = {
  available: { employeeId: null, decommissionedAt: null },
  in_use: { employeeId: { not: null } },
  decommissioned: { decommissionedAt: { not: null } },
};

const whereFor = ({ status, search, employeeIds }: DeviceListQuery): Prisma.DeviceWhereInput => ({
  ...(status ? WHERE_STATUS[status] : {}),
  ...(employeeIds ? { employeeId: { in: employeeIds } } : {}),
  ...(search
    ? {
        OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }],
      }
    : {}),
});

export class PrismaDeviceRepository implements IDeviceRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Device | null> {
    const row = await this.database.device.findUnique({ where: { id } });
    return row ? DeviceMapper.toDomain(row) : null;
  }

  async createMany(devices: Device[]): Promise<void> {
    try {
      await this.database.device.createMany({ data: devices.map(DeviceMapper.toPersistence) });
    } catch (error) {
      if (prismaCode(error) === UNIQUE_VIOLATION)
        throw new ConflictError('A device with one of these codes already exists');
      throw error;
    }
  }

  async save(device: Device): Promise<void> {
    const { id, ...data } = DeviceMapper.toPersistence(device);
    try {
      await this.database.device.update({ where: { id }, data });
    } catch (error) {
      const code = prismaCode(error);
      if (code === RECORD_NOT_FOUND) throw new NotFoundError('Device', id);
      if (code === UNIQUE_VIOLATION) throw new ConflictError(`Device code ${data.code} is already in use`);
      if (code === FOREIGN_KEY_VIOLATION) throw new NotFoundError('Employee', data.employeeId ?? '');
      throw error;
    }
  }

  async assignIfAvailable(deviceId: string, employeeId: string): Promise<boolean> {
    try {
      const { count } = await this.database.device.updateMany({
        where: { id: deviceId, ...WHERE_STATUS.available },
        data: { employeeId },
      });
      return count === 1;
    } catch (error) {
      if (prismaCode(error) === FOREIGN_KEY_VIOLATION) throw new NotFoundError('Employee', employeeId);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.database.device.deleteMany({ where: { id } });
    return count > 0;
  }

  async list(query: DeviceListQuery): Promise<DevicePage> {
    const where = whereFor(query);
    const [rows, total] = await Promise.all([
      this.database.device.findMany({
        where,
        orderBy: [{ name: 'asc' }, { code: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.database.device.count({ where }),
    ]);
    return { items: rows.map(DeviceMapper.toDomain), total };
  }

  async countByStatus(): Promise<DeviceCounts> {
    const [total, inUse, decommissioned] = await Promise.all([
      this.database.device.count(),
      this.database.device.count({ where: WHERE_STATUS.in_use }),
      this.database.device.count({ where: WHERE_STATUS.decommissioned }),
    ]);
    // The DB CHECK keeps in-use and decommissioned disjoint, so the rest are available.
    return { total, available: total - inUse - decommissioned, inUse, decommissioned };
  }
}
