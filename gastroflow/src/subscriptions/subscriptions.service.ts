import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from './entities/subscription.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,

    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: createSubscriptionDto.restaurant_id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const subscription = new Subscription();
    subscription.restaurant = restaurant;
    subscription.restaurant_id = createSubscriptionDto.restaurant_id;
    subscription.plan_type = createSubscriptionDto.plan_type;
    subscription.status =
      createSubscriptionDto.status ?? SubscriptionStatus.PENDING;
    subscription.start_date = new Date(createSubscriptionDto.start_date);
    subscription.end_date = new Date(createSubscriptionDto.end_date);
    subscription.next_payment_date = createSubscriptionDto.next_payment_date
      ? new Date(createSubscriptionDto.next_payment_date)
      : undefined;
    subscription.auto_renew = createSubscriptionDto.auto_renew ?? true;

    return await this.subscriptionsRepository.save(subscription);
  }

  async findAll(): Promise<Subscription[]> {
    return await this.subscriptionsRepository.find({
      relations: ['restaurant'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (updateSubscriptionDto.plan_type !== undefined) {
      subscription.plan_type = updateSubscriptionDto.plan_type;
    }

    if (updateSubscriptionDto.status !== undefined) {
      subscription.status = updateSubscriptionDto.status;
    }

    if (updateSubscriptionDto.start_date !== undefined) {
      subscription.start_date = new Date(updateSubscriptionDto.start_date);
    }

    if (updateSubscriptionDto.end_date !== undefined) {
      subscription.end_date = new Date(updateSubscriptionDto.end_date);
    }

    if (updateSubscriptionDto.next_payment_date !== undefined) {
      subscription.next_payment_date = new Date(
        updateSubscriptionDto.next_payment_date,
      );
    }

    if (updateSubscriptionDto.auto_renew !== undefined) {
      subscription.auto_renew = updateSubscriptionDto.auto_renew;
    }

    return await this.subscriptionsRepository.save(subscription);
  }

  async remove(id: string): Promise<{ message: string }> {
    const subscription = await this.findOne(id);
    await this.subscriptionsRepository.softRemove(subscription);

    return { message: 'Suscripción eliminada correctamente' };
  }
}
