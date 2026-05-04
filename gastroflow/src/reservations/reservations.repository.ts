import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';

import { Reservation } from './entities/reservation.entity';
import { newReservation } from './dto/reservation.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { ReservationStatus } from '../common/reservation.enum';
import { RestaurantTablesRepository } from '../restaurant_tables/restaurant_tables.repository';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { User } from '../users/entities/user.entity';
import { ReservationsPaymentService } from '../reservations-payment/reservations-payment.service';

export interface CreateReservationResult {
  reservation: Reservation;
  paymentUrl: string | null;
}

export interface CashierReservationItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  guests_count: number;
  status: ReservationStatus;
  notes: string | null;
  reservation_date: Date;
  start_time: Date;
  end_time: Date;
  table: {
    id: string;
    table_number: number;
  } | null;
  created_at: Date;
  updated_at: Date;
}

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

  async getCashierReservationsByDate(
    restaurantId: string,
    date?: string,
    status?: ReservationStatus,
  ): Promise<CashierReservationItem[]> {
    const targetDate = date ? new Date(`${date}T00:00:00`) : new Date();

    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Fecha inválida. Usa formato YYYY-MM-DD');
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const reservations = await this.reservationsRepository.find({
      where: {
        restaurant: { id: restaurantId },
        reservation_date: Between(dayStart, dayEnd),
        ...(status ? { status } : {}),
      },
      relations: ['table'],
      order: {
        start_time: 'ASC',
      },
    });

    return reservations.map((reservation) => ({
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
    }));
  }

  async createNewReservation(
    restaurantId: string,
    reservationData: newReservation,
    userId: string,
  ): Promise<CreateReservationResult> {
    const startTime = new Date(reservationData.start_time);
    const endTime = new Date(startTime.getTime() + (2 * 60 + 15) * 60 * 1000);

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

    const conflict = await this.reservationsRepository.findOne({
      where: {
        table: { id: reservationData.table_id },
        status: In([ReservationStatus.CONFIRMED, ReservationStatus.PENDING]),
        start_time: LessThan(endTime),
        end_time: MoreThan(startTime),
      },
    });

    if (conflict)
      throw new BadRequestException('La mesa ya está reservada en ese horario');

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

    const reservation = await this.reservationsRepository.findOne({
      where: { id: savedReservation.id },
      relations: ['user', 'table', 'restaurant'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      reservation,
      paymentUrl: reservationPayment.url,
    };
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

    reservation.status = ReservationStatus.CANCELADO;

    await this.restaurantsTableRepository.updateStatus(
      restaurantId,
      reservation.table.id,
      RestaurantTableStatus.AVAILABLE,
    );

    return this.reservationsRepository.save(reservation);
  }
}
