import { Injectable, Logger } from '@nestjs/common';
import { newReservation } from './dto/reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { MailService } from '../mail/mail.service';
import { CashierReservationsQueryDto } from './dto/cashier-reservations-query.dto';
import { ReservationGateway } from './gateways/reservation.gateway';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly mailService: MailService,
    private readonly reservationGateway: ReservationGateway,
  ) {}

  async AllReservations(restaurantId: string) {
    return await this.reservationsRepository.AllReservations(restaurantId);
  }

  async getCashierReservations(
    restaurantId: string,
    query: CashierReservationsQueryDto,
  ) {
    const reservations =
      await this.reservationsRepository.getCashierReservationsByDate(
        restaurantId,
        query.date,
        query.status,
      );

    return {
      date: query.date ?? new Date().toISOString().slice(0, 10),
      total: reservations.length,
      data: reservations,
    };
  }

  async createNewReservation(
    restaurantId: string,
    reservationData: newReservation,
    userId: string,
  ) {
    const { reservation, paymentUrl } =
      await this.reservationsRepository.createNewReservation(
        restaurantId,
        reservationData,
        userId,
      );

    try {
      if (reservation.user?.email) {
        await this.mailService.sendReservationCreatedEmail({
          to: reservation.user.email,
          name: reservation.user.first_name,
          date: reservation.start_time.toLocaleDateString('es-CO'),
          time: reservation.start_time.toLocaleTimeString('es-CO'),
        });
      }
    } catch {
      this.logger.warn(
        'La reserva se creÃ³ correctamente, pero fallÃ³ el envÃ­o del correo',
      );
    }

    this.reservationGateway.emitToRestaurant(
      restaurantId,
      'reservation:created',
      this.buildRealtimePayload(reservation),
    );

    return paymentUrl;
  }

  async cancelReservation(restaurantId: string, reservationId: string) {
    const cancelledReservation =
      await this.reservationsRepository.cancelReservation(
        restaurantId,
        reservationId,
      );

    try {
      if (cancelledReservation?.user?.email) {
        await this.mailService.sendReservationCancelledEmail({
          to: cancelledReservation.user.email,
          name: cancelledReservation.user.first_name,
        });
      }
    } catch {
      this.logger.warn(
        'La reserva se cancelÃ³ correctamente, pero fallÃ³ el envÃ­o del correo',
      );
    }

    this.reservationGateway.emitToRestaurant(
      restaurantId,
      'reservation:cancelled',
      this.buildRealtimePayload(cancelledReservation),
    );

    return cancelledReservation;
  }

  private buildRealtimePayload(reservation: Reservation) {
    return {
      id: reservation.id,
      customer_name: reservation.customer_name,
      customer_phone: reservation.customer_phone,
      guests_count: reservation.guests_count,
      status: reservation.status,
      notes: reservation.notes ?? null,
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      table: reservation.table
        ? {
            id: reservation.table.id,
            table_number: reservation.table.table_number,
          }
        : null,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
    };
  }
}
