import { Headers, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservationPayment } from './entities/reservations-payment.entity';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Reservation } from '../reservations/entities/reservation.entity';
import { PaymentStatus } from '../common/reservations-payment.enum';
import { ReservationStatus } from '../common/reservation.enum';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { RestaurantTablesRepository } from '../restaurant_tables/restaurant_tables.repository';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { environment } from '../config/enviroment';
import { MailService } from '../mail/mail.service';

const stripe = new Stripe(environment.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

@Injectable()
export class ReservationsPaymentService {
  constructor(
    @InjectRepository(ReservationPayment)
    private reservationsPaymentRepository: Repository<ReservationPayment>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private readonly restaurantsTableRepository: RestaurantTablesRepository,
    private readonly mailService: MailService,
  ) {}

  async stripeCheckout(reservationId: string): Promise<{ url: string | null }> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    const existingPayment = await this.reservationsPaymentRepository.findOne({
      where: {
        reservation: { id: reservationId },
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment?.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(
        existingPayment.stripe_session_id,
      );
      if (session.url) return { url: session.url };
    }

    const DEPOSIT_AMOUNT = 5;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: 'https://front-gastroflow.onrender.com/success',
      cancel_url: 'https://front-gastroflow.onrender.com/cancel',
      metadata: {
        reservation_id: reservationId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: DEPOSIT_AMOUNT * 100, // Stripe usa centavos
            product_data: {
              name: `Seña reserva - ${reservation.customer_name}`,
              description: `Reserva para ${reservation.guests_count} personas`,
            },
          },
        },
      ],
    });

    await this.reservationsPaymentRepository.save({
      reservation,
      amount: DEPOSIT_AMOUNT,
      currency: 'usd',
      provider: 'stripe',
      stripe_session_id: session.id,
      status: PaymentStatus.PENDING,
    });

    return { url: session.url };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object);
        break;

      case 'checkout.session.async_payment_failed':
        await this.handleCheckoutExpired(event.data.object); // misma lógica que expired
        break;
    }
  }

  private async handleCheckoutCompleted(session: any) {
    const reservationId = session.metadata?.reservation_id;
    console.log('2. reservationId:', reservationId);

    if (!reservationId) {
      console.log('No hay reservationId en metadata');
      return;
    }

    try {
      await this.reservationsRepository.update(
        { id: reservationId },
        { status: ReservationStatus.CONFIRMED },
      );
      const reservation = await this.reservationsRepository.findOne({
        where: { id: reservationId },
        relations: ['restaurant', 'table'],
      });

      if (!reservation) throw new NotFoundException('Reserva no encontrada');

      await this.restaurantsTableRepository.updateStatus(
        reservation.restaurant.id,
        reservation.table.id,
        RestaurantTableStatus.RESERVED,
      );

      const payment = await this.reservationsPaymentRepository
        .createQueryBuilder('payment')
        .where('payment.reservation_id = :reservationId', { reservationId })
        .getOne();
      if (!payment) {
        console.error('Pago no encontrado para reservationId:', reservationId);
        return;
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.transaction_id = session.payment_intent as string;
      payment.paid_at = new Date();

      const saved = await this.reservationsPaymentRepository.save(payment);
      console.log('4. Pago guardado:', saved);
      if (reservation.customer_email) {
        await this.mailService.sendPaymentConfirmationEmail({
          to: reservation.customer_email,
          name: reservation.customer_name,
          restaurantName: reservation.restaurant.name,
          amount: payment.amount,
        });
      }
    } catch (error) {
      console.error('Error en handleCheckoutCompleted:', error);
    }
  }

  private async handleCheckoutExpired(session: any) {
    const reservationId = session.metadata?.reservation_id;
    if (!reservationId) return;

    await this.reservationsRepository.update(
      { id: reservationId },
      { status: ReservationStatus.CANCELADO },
    );
  }
}
