import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantTables } from './entities/restaurant_table.entity';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import {
  AssignWaiterToTableDto,
  CreateTableDto,
  UpdateTableDto,
  UpdateTablesLayoutDto,
} from './dto/restaurant_table.dto';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationStatus } from '../common/reservation.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/user.enums';

export const tablesSeed = [
  { table_number: 1, capacity: 2, zone: 'Interior' },
  { table_number: 2, capacity: 2, zone: 'Interior' },
  { table_number: 3, capacity: 4, zone: 'Interior' },
  { table_number: 4, capacity: 4, zone: 'Interior' },
  { table_number: 5, capacity: 4, zone: 'Terraza' },
  { table_number: 6, capacity: 6, zone: 'Terraza' },
  { table_number: 7, capacity: 6, zone: 'Terraza' },
  { table_number: 8, capacity: 8, zone: 'Salón privado' },
  { table_number: 9, capacity: 8, zone: 'Salón privado' },
  { table_number: 10, capacity: 10, zone: 'Salón privado' },
];

@Injectable()
export class RestaurantTablesRepository {
  constructor(
    @InjectRepository(RestaurantTables)
    private restaurantsTablesRepository: Repository<RestaurantTables>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getTablesAssignments(restaurantId: string) {
    const tables = await this.restaurantsTablesRepository.find({
      where: { restaurant: { id: restaurantId }, is_active: true },
      relations: ['assigned_waiter'],
      order: { table_number: 'ASC' },
    });

    return tables.map((table) => ({
      id: table.id,
      table_number: table.table_number,
      zone: table.zone,
      capacity: table.capacity,
      status: table.status,
      is_active: table.is_active,
      assigned_waiter: table.assigned_waiter
        ? {
            id: table.assigned_waiter.id,
            first_name: table.assigned_waiter.first_name,
            last_name: table.assigned_waiter.last_name,
            email: table.assigned_waiter.email,
          }
        : null,
      updated_at: table.updated_at,
    }));
  }

  async getRestaurantWaiters(restaurantId: string) {
    const waiters = await this.usersRepository.find({
      where: {
        restaurant_id: restaurantId,
        role: UserRole.WAITER,
        is_active: true,
      },
      order: {
        first_name: 'ASC',
      },
    });

    return waiters.map((waiter) => ({
      id: waiter.id,
      first_name: waiter.first_name,
      last_name: waiter.last_name,
      email: waiter.email,
    }));
  }

  async getWaiterAssignedTables(
    restaurantId: string,
    waiterId: string,
    date?: string,
    time?: string,
  ) {
    const assignedTables = await this.restaurantsTablesRepository.find({
      where: {
        restaurant: { id: restaurantId },
        is_active: true,
        assigned_waiter_id: waiterId,
      },
      order: { table_number: 'ASC' },
    });

    if (!date || !time || !assignedTables.length) {
      return assignedTables;
    }

    const startTime = new Date(`${date}T${time}:00.000Z`);
    const endTime = new Date(startTime.getTime() + (2 * 60 + 15) * 60 * 1000);

    const assignedTableIds = assignedTables.map((table) => table.id);

    const occupiedTables = await this.reservationsRepository.find({
      where: {
        restaurant: { id: restaurantId },
        table: { id: In(assignedTableIds) },
        status: In([ReservationStatus.CONFIRMED, ReservationStatus.PENDING]),
        start_time: LessThan(endTime),
        end_time: MoreThan(startTime),
      },
      relations: ['table'],
    });

    const occupiedIds = new Set(occupiedTables.map((reservation) => reservation.table.id));

    return assignedTables.map((table) => ({
      ...table,
      status: occupiedIds.has(table.id)
        ? RestaurantTableStatus.RESERVED
        : RestaurantTableStatus.AVAILABLE,
    }));
  }

  async assignWaiterToTable(
    restaurantId: string,
    tableId: string,
    dto: AssignWaiterToTableDto,
  ) {
    const table = await this.restaurantsTablesRepository.findOne({
      where: { id: tableId, restaurant: { id: restaurantId } },
      relations: ['assigned_waiter'],
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    if (!table.is_active) {
      throw new BadRequestException('No se puede asignar una mesa inactiva');
    }

    const waiter = await this.usersRepository.findOne({
      where: {
        id: dto.waiter_id,
        restaurant_id: restaurantId,
        role: UserRole.WAITER,
        is_active: true,
      },
    });

    if (!waiter) {
      throw new NotFoundException(
        'Mozo no encontrado o no pertenece al restaurante',
      );
    }

    table.assigned_waiter_id = waiter.id;
    table.assigned_waiter = waiter;

    const saved = await this.restaurantsTablesRepository.save(table);

    return {
      message: 'Mozo asignado correctamente',
      data: {
        table_id: saved.id,
        table_number: saved.table_number,
        waiter: {
          id: waiter.id,
          first_name: waiter.first_name,
          last_name: waiter.last_name,
          email: waiter.email,
        },
      },
    };
  }

  async unassignWaiterFromTable(restaurantId: string, tableId: string) {
    const table = await this.restaurantsTablesRepository.findOne({
      where: { id: tableId, restaurant: { id: restaurantId } },
      relations: ['assigned_waiter'],
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    if (!table.assigned_waiter_id) {
      return {
        message: 'La mesa ya estaba sin mozo asignado',
        data: {
          table_id: table.id,
          table_number: table.table_number,
          waiter: null,
        },
      };
    }

    table.assigned_waiter_id = null;
    table.assigned_waiter = null;

    const saved = await this.restaurantsTablesRepository.save(table);

    return {
      message: 'Asignación removida correctamente',
      data: {
        table_id: saved.id,
        table_number: saved.table_number,
        waiter: null,
      },
    };
  }

  async getAvailableTables(restaurantId: string, date: string, time: string) {
    console.log('getAvailableTables:', { restaurantId, date, time });
    const allTables = await this.restaurantsTablesRepository.find({
      where: { restaurant: { id: restaurantId }, is_active: true },
    });
    if (!date || !time) return allTables;

    if (!allTables.length)
      throw new NotFoundException(
        'No se encontraron mesas para este restaurante',
      );

    const startTime = new Date(`${date}T${time}:00.000Z`);
    const endTime = new Date(startTime.getTime() + (2 * 60 + 15) * 60 * 1000);

    const occupiedTables = await this.reservationsRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: In([ReservationStatus.CONFIRMED, ReservationStatus.PENDING]), // ← agregá PENDING
        start_time: LessThan(endTime),
        end_time: MoreThan(startTime),
      },
      relations: ['table'],
    });

    const occupiedIds = occupiedTables.map((r) => r.table.id);

    return allTables.map((table) => ({
      ...table,
      status: occupiedIds.includes(table.id)
        ? RestaurantTableStatus.RESERVED
        : RestaurantTableStatus.AVAILABLE,
    }));
  }

  async updateStatus(
    restaurantId: string,
    tableId: string,
    status: RestaurantTableStatus,
  ) {
    const table = await this.restaurantsTablesRepository.findOne({
      where: {
        id: tableId,
        restaurant: { id: restaurantId },
      },
    });

    if (!table) throw new NotFoundException('Mesa no encontrada');
    if (!table.is_active)
      throw new BadRequestException('La mesa no está activa');
    if (table.status === status) return table;

    table.status = status;
    return this.restaurantsTablesRepository.save(table);
  }

  async updateTable(
    restaurantId: string,
    tableId: string,
    tableData: UpdateTableDto,
  ) {
    const table = await this.restaurantsTablesRepository.findOne({
      where: {
        id: tableId,
        restaurant: { id: restaurantId },
      },
    });

    if (!table) throw new NotFoundException('Mesa no encontrada');

    const allowedFields: (keyof UpdateTableDto)[] = [
      'table_number',
      'capacity',
      'zone',
      'is_active',
      'layout_x',
      'layout_y',
      'layout_width',
      'layout_height',
      'layout_shape',
      'layout_rotation',
      'is_visible',
    ];

    for (const field of allowedFields) {
      if (tableData[field] !== undefined) {
        (table as unknown as Record<string, unknown>)[field] = tableData[field];
      }
    }

    return this.restaurantsTablesRepository.save(table);
  }

  async updateTablesLayout(
    restaurantId: string,
    layoutData: UpdateTablesLayoutDto,
  ) {
    const tableIds = layoutData.tables.map((table) => table.id);
    const tables = await this.restaurantsTablesRepository.find({
      where: {
        id: In(tableIds),
        restaurant: { id: restaurantId },
      },
    });

    if (tables.length !== new Set(tableIds).size) {
      throw new NotFoundException(
        'Una o mas mesas no pertenecen al restaurante indicado',
      );
    }

    const tablesById = new Map(tables.map((table) => [table.id, table]));

    for (const layoutItem of layoutData.tables) {
      const table = tablesById.get(layoutItem.id);

      if (!table) continue;

      table.layout_x = layoutItem.layout_x;
      table.layout_y = layoutItem.layout_y;

      if (layoutItem.layout_width !== undefined) {
        table.layout_width = layoutItem.layout_width;
      }

      if (layoutItem.layout_height !== undefined) {
        table.layout_height = layoutItem.layout_height;
      }

      if (layoutItem.layout_shape !== undefined) {
        table.layout_shape = layoutItem.layout_shape;
      }

      if (layoutItem.layout_rotation !== undefined) {
        table.layout_rotation = layoutItem.layout_rotation;
      }

      if (layoutItem.is_visible !== undefined) {
        table.is_visible = layoutItem.is_visible;
      }
    }

    return this.restaurantsTablesRepository.save(tables);
  }

  async seedTables(restaurantId: string) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

    const existingTables = await this.restaurantsTablesRepository.count({
      where: { restaurant: { id: restaurantId } },
    });

    if (existingTables > 0)
      throw new BadRequestException('El restaurante ya tiene mesas cargadas');

    const tables = tablesSeed.map((table) =>
      this.restaurantsTablesRepository.create({
        ...table,
        restaurant,
      }),
    );

    return this.restaurantsTablesRepository.save(tables);
  }

  async createNewTable(restaurantId: string, newTableData: CreateTableDto) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

    const newTable = this.restaurantsTablesRepository.create({
      ...newTableData,
      restaurant,
    });

    return this.restaurantsTablesRepository.save(newTable);
  }

  async deactivateTable(restaurantId: string, tableId: string) {
    const table = await this.restaurantsTablesRepository.findOne({
      where: {
        id: tableId,
        restaurant: { id: restaurantId },
      },
    });

    if (!table) throw new NotFoundException('Mesa no encontrada');
    if (!table.is_active)
      throw new BadRequestException('La mesa ya está desactivada');

    table.is_active = false;
    return this.restaurantsTablesRepository.save(table);
  }
}
