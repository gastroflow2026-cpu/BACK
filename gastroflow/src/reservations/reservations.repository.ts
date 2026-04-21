import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';

import { Reservation } from './entities/reservation.entity';
import { newReservation } from './dto/reservation.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { ReservationStatus } from '../common/reservation.enum';
import { RestaurantTablesRepository } from '../restaurant_tables/restaurant_tables.repository';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { User } from '../users/entities/user.entity';
import { ReservationsPaymentService } from '../reservations-payment/reservations-payment.service';

@Injectable()
export class ReservationsRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,

    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantTables)
    private readonly restaurantTablesRepository: Repository<RestaurantTables>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly restaurantsTableRepository: RestaurantTablesRepository,
    private readonly reservationsPaymentService: ReservationsPaymentService,
  ) {}

  async AllReservations(restaurantId: string) {
    const reservations = await this.reservationsRepository.find({
      where: {
        restaurant: { id: restaurantId },
      },
      relations: ['table', 'user'],
    });

    if (!reservations.length) {
      throw new NotFoundException(
        'No se encontraron reservas para este restaurante',
      );
    }

    return reservations;
  }

  async createNewReservation(
    restaurantId: string,
    reservationData: newReservation,
    userId: string,
  ) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { start_time, table_id } = reservationData;

    const table = await this.restaurantTablesRepository.findOne({
      where: { id: table_id },
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    const tableNotAvailable = await this.reservationsRepository.findOne({
      where: {
        restaurant: { id: restaurantId },
        table: { id: table_id },
        status: ReservationStatus.CONFIRMED,
        start_time: LessThan(
          new Date(new Date(start_time).getTime() + (2 * 60 + 15) * 60 * 1000),
        ),
        end_time: MoreThan(new Date(start_time)),
      },
      relations: ['table'],
    });

    if (tableNotAvailable) {
      throw new BadRequestException('Mesa no disponible');
    }

    const createReservation = this.reservationsRepository.create({
      ...reservationData,
      status: ReservationStatus.PENDING,
      restaurant,
      table,
      user,
      start_time: new Date(start_time),
      end_time: new Date(
        new Date(start_time).getTime() + (2 * 60 + 15) * 60 * 1000,
      ),
    });

    let savedReservation: Reservation;

    try {
      savedReservation =
        await this.reservationsRepository.save(createReservation);
    } catch {
      throw new InternalServerErrorException('Error al guardar la reserva');
    }

    await this.restaurantsTableRepository.updateStatus(
      restaurantId,
      reservationData.table_id,
      RestaurantTableStatus.RESERVED,
    );

    const reservationPayment =
      await this.reservationsPaymentService.stripeCheckout(savedReservation.id);

    return reservationPayment.url;
  }

  async cancelReservation(restaurantId: string, reservationId: string) {
    const reservation = await this.reservationsRepository.findOne({
      where: {
        id: reservationId,
        restaurant: { id: restaurantId },
      },
      relations: ['table', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.status === 'CANCELADO') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    reservation.status = 'CANCELADO';

    await this.restaurantsTableRepository.updateStatus(
      restaurantId,
      reservation.table.id,
      RestaurantTableStatus.AVAILABLE,
    );

    return this.reservationsRepository.save(reservation);
  }
}
