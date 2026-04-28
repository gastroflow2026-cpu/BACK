import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantTables } from './entities/restaurant_table.entity';
import { RestaurantTablesController } from './restaurant_tables.controller';
import { RestaurantTablesService } from './restaurant_tables.service';
import { RestaurantTablesRepository } from './restaurant_tables.repository';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RestaurantTables, Restaurant, Reservation])],
    controllers: [RestaurantTablesController],
    providers: [RestaurantTablesService, RestaurantTablesRepository],
    exports: [RestaurantTablesRepository]
})
export class RestaurantTablesModule {}
