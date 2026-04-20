import { Module } from '@nestjs/common';
import { ReservationsPaymentController } from './reservations-payment.controller';
import { ReservationsPaymentService } from './reservations-payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationPayment } from './entities/reservations-payment.entity';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { RestaurantTablesRepository } from '../restaurant_tables/restaurant_tables.repository';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationPayment, RestaurantTables, Restaurant])],
  controllers: [ReservationsPaymentController],
  providers: [ReservationsPaymentService, RestaurantTablesRepository],
  exports: [ReservationsPaymentService, RestaurantTablesRepository]
})
export class ReservationsPaymentModule {}
