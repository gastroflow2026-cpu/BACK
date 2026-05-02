import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PlanType } from '../subscriptions/enums/plan-type.enum';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { environment } from '../config/enviroment';
import { SubscriptionPayment } from './entities/subscription_payment.entity';
import { SubscriptionPaymentStatus } from '../common/subscription_payment.enum';

const stripe = new Stripe(environment.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

// Map de PlanType + intervalo → Price ID de Stripe
const STRIPE_PRICE_IDS: Record<string, string> = {
  BASIC_MONTHLY: environment.STRIPE_PRICE_BASIC_MONTHLY!,
  BASIC_YEARLY: environment.STRIPE_PRICE_BASIC_YEARLY!,
  PREMIUM_MONTHLY: environment.STRIPE_PRICE_PREMIUM_MONTHLY!,
  PREMIUM_YEARLY: environment.STRIPE_PRICE_PREMIUM_YEARLY!,
};

@Injectable()
export class SubscriptionsPaymentService {
  constructor(
    @InjectRepository(SubscriptionPayment)
    private subscriptionPaymentRepository: Repository<SubscriptionPayment>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async stripeCheckout(
    subscriptionId: string,
    interval: 'monthly' | 'yearly',
  ): Promise<{ url: string | null }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['restaurant'],
    });

    if (!subscription) throw new NotFoundException('Suscripción no encontrada');

    const key = `${subscription.plan_type}_${interval.toUpperCase()}`;
    const priceId = STRIPE_PRICE_IDS[key];

    if (!priceId) throw new NotFoundException(`Price ID no encontrado para ${key}`);

    const amount = {
      BASIC_MONTHLY: 50,
      BASIC_YEARLY: 500,
      PREMIUM_MONTHLY: 80,
      PREMIUM_YEARLY: 800,
    }[key] ?? 0;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: `${environment.FRONTEND_URL}/subscription/success`,
      cancel_url: `${environment.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        subscription_id: subscriptionId,
        interval,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    });

    await this.subscriptionPaymentRepository.save({
      subscription,
      amount,
      currency: 'usd',
      provider: 'stripe',
      stripe_session_id: session.id,
      status: SubscriptionPaymentStatus.PENDING,
    });

    return { url: session.url };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
        await this.handleSubscriptionCancelled(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private async handleCheckoutCompleted(session: any) {
    const subscriptionId = session.metadata?.subscription_id;
    const interval = session.metadata?.interval;
    if (!subscriptionId) return;

    const now = new Date();
    const endDate = new Date(now);
    if (interval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const nextPaymentDate = new Date(endDate);

    await this.subscriptionRepository.update(
      { id: subscriptionId },
      {
        status: SubscriptionStatus.ACTIVE,
        start_date: now,
        end_date: endDate,
        next_payment_date: nextPaymentDate,
        stripe_subscription_id: session.subscription,
      },
    );

    await this.subscriptionPaymentRepository.update(
      { stripe_session_id: session.id },
      {
        status: SubscriptionPaymentStatus.COMPLETED,
        transaction_id: session.payment_intent as string,
        paid_at: new Date(),
      },
    );
  }

  private async handleSubscriptionCancelled(stripeSubscription: any) {
    const subscription = await this.subscriptionRepository.findOne({
    where: { stripe_subscription_id: stripeSubscription.id }, // 👈
    });

    if (!subscription) return;

    await this.subscriptionRepository.update(
      { id: subscription.id },
      { status: SubscriptionStatus.CANCELLED },
    );
  }

  private async handlePaymentFailed(invoice: any) {
    const subscriptionId = invoice.metadata?.subscription_id;
    if (!subscriptionId) return;

    await this.subscriptionPaymentRepository.update(
      { subscription: { id: subscriptionId } },
      { status: SubscriptionPaymentStatus.FAILED },
    );
  }
}