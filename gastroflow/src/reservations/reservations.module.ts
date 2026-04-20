import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { ReservationsRepository } from './reservations.repository';
import { RestaurantTablesRepository } from '../restaurant_tables/restaurant_tables.repository';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Reservation, Restaurant, RestaurantTables, User])],
    controllers: [ReservationsController],
    providers: [ReservationsService, ReservationsRepository, RestaurantTablesRepository]
})
export class ReservationsModule {}
