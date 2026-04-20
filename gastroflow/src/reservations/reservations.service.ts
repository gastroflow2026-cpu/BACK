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
    const savedReservation =
      await this.reservationsRepository.createNewReservation(
        restaurantId,
        reservationData,
        userId,
      );

    try {
      if (savedReservation?.user?.email) {
        await this.mailService.sendReservationCreatedEmail({
          to: savedReservation.user.email,
          name: savedReservation.user.first_name,
          date: savedReservation.start_time.toLocaleDateString('es-CO'),
          time: savedReservation.start_time.toLocaleTimeString('es-CO'),
        });
      }
    } catch {
      this.logger.warn(
        'La reserva se creó correctamente, pero falló el envío del correo',
      );
    }

    return savedReservation;
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
        'La reserva se canceló correctamente, pero falló el envío del correo',
      );
    }

    return cancelledReservation;
  }
}
