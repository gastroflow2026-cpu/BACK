import { Injectable, Logger } from '@nestjs/common';
import { newReservation } from './dto/reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly mailService: MailService,
  ) {}

  async AllReservations(restaurantId: string) {
    return await this.reservationsRepository.AllReservations(restaurantId);
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

    return cancelledReservation;
  }
}
