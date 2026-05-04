import { RestaurantTablesModule } from './../restaurant_tables/restaurant_tables.module';
import { Module } from '@nestjs/common';
import { ReservationsPaymentController } from './reservations-payment.controller';
import { ReservationsPaymentService } from './reservations-payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationPayment } from './entities/reservations-payment.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationPayment, Restaurant]),
    MailModule,
    RestaurantTablesModule,
  ],
  controllers: [ReservationsPaymentController],
  providers: [ReservationsPaymentService],
  exports: [ReservationsPaymentService],
})
export class ReservationsPaymentModule {}
