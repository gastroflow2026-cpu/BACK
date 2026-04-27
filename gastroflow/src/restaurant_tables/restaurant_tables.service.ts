import { Injectable } from '@nestjs/common';
import { RestaurantTablesRepository } from './restaurant_tables.repository';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { CreateTableDto } from './dto/restaurant_table.dto';

@Injectable()
export class RestaurantTablesService {

    constructor(private readonly restaurantsTablesRepository: RestaurantTablesRepository){}

    async getAvailableTables(restaurantId: string, date: string, time: string) {
        return await this.restaurantsTablesRepository.getAvailableTables(restaurantId, date, time)
    }

    async updateStatus(restaurantId: string, tableId: string, status: RestaurantTableStatus){
        return await this.restaurantsTablesRepository.updateStatus(restaurantId, tableId, status)
    }

    async seedTables(restaurantId: string) {
        return await this.restaurantsTablesRepository.seedTables(restaurantId);
    }

    async createNewTable(restaurantId: string, newTableData: CreateTableDto) {
        return await this.restaurantsTablesRepository.createNewTable(restaurantId, newTableData);
    }

    async deactivateTable(restaurantId: string, tableId: string) {
        return this.restaurantsTablesRepository.deactivateTable(restaurantId, tableId);
    }
    
}