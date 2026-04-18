import { Injectable } from '@nestjs/common';
import { RestaurantTablesRepository } from './restaurant_tables.repository';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';

@Injectable()
export class RestaurantTablesService {

    constructor(private readonly restaurantsTablesRepository: RestaurantTablesRepository){}

    async getAvailableTables(restaurantId: string) {
        return await this.restaurantsTablesRepository.getAvailableTables(restaurantId)
    }

    async updateStatus(restaurantId: string, tableId: string, status: RestaurantTableStatus){
        return await this.restaurantsTablesRepository.updateStatus(restaurantId, tableId, status)
    }

    async seedTables(restaurantId: string) {
        return await this.restaurantsTablesRepository.seedTables(restaurantId);
    }
}