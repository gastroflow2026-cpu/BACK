import { BadRequestException, Headers, Injectable, NotFoundException } from '@nestjs/common';
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

const stripe = new Stripe(environment.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })


@Injectable()
export class ReservationsPaymentService {

    constructor(
    @InjectRepository(ReservationPayment) private reservationsPaymentRepository: Repository<ReservationPayment>,
    @InjectRepository(Reservation) private reservationsRepository: Repository<Reservation>,
    private readonly restaurantsTableRepository: RestaurantTablesRepository,
    ) {}

    
    async stripeCheckout(reservationId: string): Promise<{ url: string | null }>  {
        const reservation = await this.reservationsRepository.findOne({
            where: { id: reservationId },
        });
        if (!reservation) throw new NotFoundException('Reserva no encontrada');
        
        const DEPOSIT_AMOUNT = 5;
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: 'http://localhost:3001/success',
            cancel_url: 'http://localhost:3001/restaurant/1',
            metadata: {
                reservation_id: reservationId,
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: (DEPOSIT_AMOUNT * 100), // Stripe usa centavos
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
            status: PaymentStatus.PENDING,
        });
        
        return session ;
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
    console.log('handleCheckoutCompleted ejecutado', session.metadata);
    
    const reservationId = session.metadata?.reservation_id;
    console.log('reservationId:', reservationId);
    
    if (!reservationId) {
        console.log('No hay reservationId en metadata');
        return;
    }

    try {
        await this.reservationsRepository.update(
            { id: reservationId },
            { status: ReservationStatus.CONFIRMED }
        );
        console.log('Reserva actualizada');

        const reservation = await this.reservationsRepository.findOne({
            where: { id: reservationId },
            relations: ['restaurant', 'table'],
        });
        console.log('Reserva encontrada:', reservation);

        if (!reservation) throw new NotFoundException('Reserva no encontrada');

        await this.restaurantsTableRepository.updateStatus(
            reservation.restaurant.id,
            reservation.table.id,
            RestaurantTableStatus.RESERVED,
        );
        console.log('Mesa actualizada');

        await this.reservationsPaymentRepository.update(
            { reservation: { id: reservationId } },
            {
                status: PaymentStatus.COMPLETED,
                transaction_id: session.payment_intent as string,
                paid_at: new Date(),
            }
        );
        console.log('Pago actualizado');

    } catch (error) {
        console.error('Error en handleCheckoutCompleted:', error);
    }
}

private async handleCheckoutExpired(session: any) {
    const reservationId = session.metadata?.reservation_id;
    if (!reservationId) return;

    await this.reservationsRepository.update(
        { id: reservationId },
        { status: ReservationStatus.CANCELADO }
    );
}
     
}
