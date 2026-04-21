import { BadRequestException, Body, Controller, Param, ParseUUIDPipe, Post, Req, Headers, NotFoundException} from '@nestjs/common';
import { ReservationsPaymentService } from './reservations-payment.service';
import Stripe from 'stripe';
import { environment } from '../config/enviroment';
import type {RawBodyRequest} from '@nestjs/common';

const stripe = new Stripe(environment.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

@Controller('reservations-payment')
export class ReservationsPaymentController {

    constructor(private reservationsPaymentService: ReservationsPaymentService){}

    @Post(':reservationId/checkout')
    async stripeCheckout(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ): Promise<{ url: string | null }>  {
    return await this.reservationsPaymentService.stripeCheckout(reservationId);
    }

   @Post('webhook')
    async stripeWebhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
    console.log('Webhook recibido');
    console.log('body type:', typeof req.body);
    console.log('body:', req.body);

    const payload = req.body;

    if (!payload) {
        throw new BadRequestException('No se recibió el body');
    }

    let event: any;
    if(!environment.STRIPE_WEBHOOK_SECRET) throw NotFoundException
    try {
        event = stripe.webhooks.constructEvent(payload, sig, environment.STRIPE_WEBHOOK_SECRET);
    } catch (error: any) {
        console.error('Error:', error.message);
        throw new BadRequestException(`Webhook error: ${error.message}`);
    }

    console.log('Evento:', event.type);
    return this.reservationsPaymentService.handleWebhook(event);
    }
}





