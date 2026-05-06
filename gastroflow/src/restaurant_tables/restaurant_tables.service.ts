import { Injectable } from '@nestjs/common';
import { RestaurantTablesRepository } from './restaurant_tables.repository';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import {
  AssignWaiterToTableDto,
  CreateTableDto,
  UpdateTableDto,
  UpdateTablesLayoutDto,
} from './dto/restaurant_table.dto';

@Injectable()
export class RestaurantTablesService {
  constructor(
    private readonly restaurantsTablesRepository: RestaurantTablesRepository,
  ) {}

  async getTablesAssignments(restaurantId: string) {
    return this.restaurantsTablesRepository.getTablesAssignments(restaurantId);
  }

  async getRestaurantWaiters(restaurantId: string) {
    return this.restaurantsTablesRepository.getRestaurantWaiters(restaurantId);
  }

  async getWaiterAssignedTables(
    restaurantId: string,
    waiterId: string,
    date?: string,
    time?: string,
  ) {
    return this.restaurantsTablesRepository.getWaiterAssignedTables(
      restaurantId,
      waiterId,
      date,
      time,
    );
  }

  async assignWaiterToTable(
    restaurantId: string,
    tableId: string,
    dto: AssignWaiterToTableDto,
  ) {
    return this.restaurantsTablesRepository.assignWaiterToTable(
      restaurantId,
      tableId,
      dto,
    );
  }

  async unassignWaiterFromTable(restaurantId: string, tableId: string) {
    return this.restaurantsTablesRepository.unassignWaiterFromTable(
      restaurantId,
      tableId,
    );
  }

  async getAvailableTables(restaurantId: string, date: string, time: string) {
    return await this.restaurantsTablesRepository.getAvailableTables(
      restaurantId,
      date,
      time,
    );
  }

  async updateStatus(
    restaurantId: string,
    tableId: string,
    status: RestaurantTableStatus,
  ) {
    return await this.restaurantsTablesRepository.updateStatus(
      restaurantId,
      tableId,
      status,
    );
  }

  async seedTables(restaurantId: string) {
    return await this.restaurantsTablesRepository.seedTables(restaurantId);
  }

  async createNewTable(restaurantId: string, newTableData: CreateTableDto) {
    return await this.restaurantsTablesRepository.createNewTable(
      restaurantId,
      newTableData,
    );
  }

  async updateTable(
    restaurantId: string,
    tableId: string,
    tableData: UpdateTableDto,
  ) {
    return await this.restaurantsTablesRepository.updateTable(
      restaurantId,
      tableId,
      tableData,
    );
  }

  async updateTablesLayout(
    restaurantId: string,
    layoutData: UpdateTablesLayoutDto,
  ) {
    return await this.restaurantsTablesRepository.updateTablesLayout(
      restaurantId,
      layoutData,
    );
  }

  async deactivateTable(restaurantId: string, tableId: string) {
    return this.restaurantsTablesRepository.deactivateTable(
      restaurantId,
      tableId,
    );
  }
}
