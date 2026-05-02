import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import Stripe from 'stripe';
import { environment } from '../config/enviroment';
import { SubscriptionsPaymentService } from './subscription_payment.service';

const stripe = new Stripe(environment.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

@Controller('subscriptions-payment')

export class SubscriptionsPaymentController {
    constructor(private subscriptionsPaymentService: SubscriptionsPaymentService) {}

    @Post(':subscriptionId/checkout')
    async stripeCheckout(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body('interval') interval: 'monthly' | 'yearly',
    ): Promise<{ url: string | null }> {
    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      throw new BadRequestException('interval debe ser "monthly" o "yearly"');
    }
    return this.subscriptionsPaymentService.stripeCheckout(subscriptionId, interval);
    }

    @Post('webhook')
    async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') sig: string,
    ) {
    console.log('Webhook de suscripción recibido');

    const payload = req.rawBody ?? req.body;
    if (!payload) throw new BadRequestException('No se recibió el body');

    if (!environment.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS) {
        throw new BadRequestException('STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS no configurado');
    }

    let event: any;
    try {  
        event = stripe.webhooks.constructEvent(
        payload,
        sig,
        environment.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS,
        );
    } catch (error: any) {
        console.error('Webhook error:', error.message);
        throw new BadRequestException(`Webhook error: ${error.message}`);
    }

    console.log('Evento de suscripción:', event.type);
    return this.subscriptionsPaymentService.handleWebhook(event);
    }

}