import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantVerificationDocument } from '../restaurant-verification/entities/restaurant-verification-document.entity';
import { RestaurantVerificationStatus } from '../common/restaurant-verification-status.enum';
import { PlatformReviewRestaurantDto } from './dto/platform-review-restaurant.dto';

import { MailService } from '../mail/mail.service';

import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../subscriptions/enums/subscription-status.enum';
import { PlanType } from '../subscriptions/enums/plan-type.enum';
import { SubscriptionPayment } from '../subscriptions_payments/entities/subscription_payment.entity';
import { SubscriptionPaymentStatus } from '../common/subscription_payment.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantVerificationDocument)
    private readonly documentRepository: Repository<RestaurantVerificationDocument>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,

    private readonly mailService: MailService,
  ) {}

  async getRestaurants(status?: RestaurantVerificationStatus) {
    const restaurants = await this.restaurantRepository.find({
      where: status ? { verification_status: status } : {},
      relations: ['users', 'subscriptions'],
      order: {
        created_at: 'DESC',
      },
    });

    return restaurants.map((restaurant) =>
      this.sanitizeRestaurantUsers(restaurant),
    );
  }

  async getPendingRestaurants() {
    const restaurants = await this.restaurantRepository.find({
      where: { verification_status: RestaurantVerificationStatus.PENDING },
      relations: ['users'],
      order: {
        created_at: 'DESC',
      },
    });

    return restaurants.map((restaurant) =>
      this.sanitizeRestaurantUsers(restaurant),
    );
  }

  async getActiveSubscriptions() {
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['restaurant'],
      order: {
        created_at: 'DESC',
      },
    });

    return subscriptions.map((subscription) => ({
      ...subscription,
      days_remaining: this.getRemainingDays(subscription.end_date),
    }));
  }

  async getSubscriptionRevenueMetrics() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const totalRevenueRaw = await this.subscriptionPaymentRepository
      .createQueryBuilder('payment')
      .select('payment.currency', 'currency')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .addSelect('COUNT(payment.id)', 'payments_count')
      .where('payment.status = :completedStatus', {
        completedStatus: SubscriptionPaymentStatus.COMPLETED,
      })
      .groupBy('payment.currency')
      .orderBy('payment.currency', 'ASC')
      .getRawMany<{
        currency: string;
        total: string;
        payments_count: string;
      }>();

    const currentMonthRevenueRaw = await this.subscriptionPaymentRepository
      .createQueryBuilder('payment')
      .select('payment.currency', 'currency')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .addSelect('COUNT(payment.id)', 'payments_count')
      .where('payment.status = :completedStatus', {
        completedStatus: SubscriptionPaymentStatus.COMPLETED,
      })
      .andWhere('COALESCE(payment.paid_at, payment.created_at) >= :currentMonthStart', {
        currentMonthStart,
      })
      .andWhere('COALESCE(payment.paid_at, payment.created_at) < :nextMonthStart', {
        nextMonthStart,
      })
      .groupBy('payment.currency')
      .orderBy('payment.currency', 'ASC')
      .getRawMany<{
        currency: string;
        total: string;
        payments_count: string;
      }>();

    const paymentStatusCountsRaw = await this.subscriptionPaymentRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(payment.id)', 'total')
      .groupBy('payment.status')
      .orderBy('payment.status', 'ASC')
      .getRawMany<{
        status: string;
        total: string;
      }>();

    return {
      generated_at: now.toISOString(),
      total_revenue: totalRevenueRaw.map((item) => ({
        currency: item.currency,
        total: Number(item.total),
        payments_count: Number(item.payments_count),
      })),
      current_month_revenue: currentMonthRevenueRaw.map((item) => ({
        currency: item.currency,
        total: Number(item.total),
        payments_count: Number(item.payments_count),
      })),
      payment_status_counts: paymentStatusCountsRaw.map((item) => ({
        status: item.status,
        total: Number(item.total),
      })),
    };
  }

  async getRestaurantReviewDetail(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['users', 'subscriptions'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const documents = await this.documentRepository.find({
      where: { restaurant_id: restaurantId },
    });

    return {
      ...this.sanitizeRestaurantUsers(restaurant),
      verification_documents: documents,
    };
  }

  async approveRestaurant(
    restaurantId: string,
    reviewerId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = RestaurantVerificationStatus.APPROVED;
    restaurant.is_active = true;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = reviewerId;
    await this.restaurantRepository.save(restaurant);

    const existingActiveSubscription = await this.subscriptionRepository.findOne({
      where: {
        restaurant_id: restaurant.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!existingActiveSubscription) {
      const startDate = new Date();
      const endDate = this.addMonths(startDate, 1);

      const subscription = this.subscriptionRepository.create({
        restaurant,
        restaurant_id: restaurant.id,
        plan_type: PlanType.BASIC,
        status: SubscriptionStatus.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        next_payment_date: endDate,
        auto_renew: true,
      });

      await this.subscriptionRepository.save(subscription);
    }

    const ownerEmail = this.getOwnerEmail(restaurant);

    if (ownerEmail) {
      await this.mailService.sendGenericNotification(
        ownerEmail,
        'Restaurante aprobado 🎉',
        `Tu restaurante "${restaurant.name}" ha sido aprobado. Ya puedes acceder al sistema.`,
      );
    }

    return {
      message: existingActiveSubscription
        ? 'Restaurante aprobado correctamente; ya existía una suscripción activa'
        : 'Restaurante aprobado y suscripción creada correctamente',
    };
  }

  async rejectRestaurant(
    restaurantId: string,
    reviewerId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = RestaurantVerificationStatus.REJECTED;
    restaurant.is_active = false;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = reviewerId;
    await this.restaurantRepository.save(restaurant);

    const ownerEmail = this.getOwnerEmail(restaurant);

    if (ownerEmail) {
      await this.mailService.sendGenericNotification(
        ownerEmail,
        'Solicitud rechazada',
        `Tu restaurante "${restaurant.name}" fue rechazado. Motivo: ${
          dto.notes ?? 'No especificado'
        }`,
      );
    }

    return {
      message: 'Restaurante rechazado correctamente',
    };
  }

  async suspendRestaurant(
    restaurantId: string,
    reviewerId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = RestaurantVerificationStatus.SUSPENDED;
    restaurant.is_active = false;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = reviewerId;
    await this.restaurantRepository.save(restaurant);

    const ownerEmail = this.getOwnerEmail(restaurant);

    if (ownerEmail) {
      await this.mailService.sendGenericNotification(
        ownerEmail,
        'Restaurante suspendido',
        `Tu restaurante "${restaurant.name}" fue suspendido. Motivo: ${
          dto.notes ?? 'No especificado'
        }`,
      );
    }

    return {
      message: 'Restaurante suspendido correctamente',
    };
  }

  async reviewRestaurant(
    restaurantId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    if (dto.status === RestaurantVerificationStatus.APPROVED) {
      return this.approveRestaurant(restaurantId, 'system', dto);
    }

    if (dto.status === RestaurantVerificationStatus.REJECTED) {
      return this.rejectRestaurant(restaurantId, 'system', dto);
    }

    return this.suspendRestaurant(restaurantId, 'system', dto);
  }

  async getRestaurantDocuments(restaurantId: string) {
    return this.documentRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
  }

  private async findRestaurantWithOwner(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['users'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    return restaurant;
  }

  private getOwnerEmail(restaurant: Restaurant): string | undefined {
    const firstUser = restaurant.users?.[0];

    return typeof firstUser?.email === 'string' ? firstUser.email : undefined;
  }

  private addMonths(date: Date, months: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }

  private getRemainingDays(endDate: Date): number {
    const end = new Date(endDate);
    const today = new Date();

    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, dayDiff);
  }

  private sanitizeRestaurantUsers<
    T extends Restaurant | (Restaurant & Record<string, unknown>),
  >(restaurant: T): T {
    if (!Array.isArray(restaurant.users)) {
      return restaurant;
    }

    const safeUsers = restaurant.users.map((user) => {
      const { password_hash: _passwordHash, ...safeUser } = user as User & {
        password_hash?: string;
      };
      return safeUser;
    });

    return {
      ...restaurant,
      users: safeUsers as unknown as User[],
    };
  }
}

