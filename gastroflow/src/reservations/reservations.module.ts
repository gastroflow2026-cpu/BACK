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
import { MailModule } from '../mail/mail.module';
import { ReservationsPaymentService } from '../reservations-payment/reservations-payment.service';
import { ReservationPayment } from '../reservations-payment/entities/reservations-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Restaurant,
      RestaurantTables,
      User,
      User,
      ReservationPayment,
    ]),
    MailModule,
  ],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    ReservationsRepository,
    RestaurantTablesRepository,
    ReservationsPaymentService,
  ],
})
export class ReservationsModule {}
