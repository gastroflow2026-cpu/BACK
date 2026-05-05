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

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantVerificationDocument)
    private readonly documentRepository: Repository<RestaurantVerificationDocument>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private readonly mailService: MailService,
  ) {}

  async getRestaurants(status?: RestaurantVerificationStatus) {
    return this.restaurantRepository.find({
      where: status ? { verification_status: status } : {},
      relations: ['users', 'subscriptions'],
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getPendingRestaurants() {
    return this.restaurantRepository.find({
      where: { verification_status: RestaurantVerificationStatus.PENDING },
      relations: ['users'],
      order: {
        created_at: 'DESC',
      },
    });
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
    return {
      generated_at: new Date().toISOString(),
      total_revenue: [],
      current_month_revenue: [],
      payment_status_counts: [],
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
      ...restaurant,
      verification_documents: documents,
    };
  }

  async approveRestaurant(
    restaurantId: string,
    reviewerId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    void reviewerId;
    void dto;

    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = RestaurantVerificationStatus.APPROVED;
    await this.restaurantRepository.save(restaurant);

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

    const ownerEmail = this.getOwnerEmail(restaurant);

    if (ownerEmail) {
      await this.mailService.sendGenericNotification(
        ownerEmail,
        'Restaurante aprobado 🎉',
        `Tu restaurante "${restaurant.name}" ha sido aprobado. Ya puedes acceder al sistema.`,
      );
    }

    return {
      message: 'Restaurante aprobado y suscripción creada correctamente',
    };
  }

  async rejectRestaurant(
    restaurantId: string,
    reviewerId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    void reviewerId;

    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = RestaurantVerificationStatus.REJECTED;
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
    void reviewerId;

    const restaurant = await this.findRestaurantWithOwner(restaurantId);

    restaurant.verification_status = dto.status;
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
}
