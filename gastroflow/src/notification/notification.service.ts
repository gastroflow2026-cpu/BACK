import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { NotificationStatus } from './enums/notification-status.enum';
import { NotificationChannel } from './enums/notification-channel.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { user_id, restaurant_id, ...data } = createNotificationDto;

    const user = await this.usersRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurant_id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const notification = new Notification();
    notification.user = user;
    notification.restaurant = restaurant;
    notification.user_id = user_id;
    notification.restaurant_id = restaurant_id;
    notification.type = data.type;
    notification.title = data.title;
    notification.message = data.message;
    notification.channel = data.channel ?? NotificationChannel.EMAIL;
    notification.status = NotificationStatus.PENDING;

    return await this.notificationsRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      relations: ['user', 'restaurant'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant'],
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);

    Object.assign(notification, updateNotificationDto);

    return await this.notificationsRepository.save(notification);
  }

  async remove(id: string): Promise<{ message: string }> {
    const notification = await this.findOne(id);

    await this.notificationsRepository.softRemove(notification);

    return { message: 'Notificación eliminada correctamente' };
  }

  async markAsSent(id: string): Promise<Notification> {
    const notification = await this.findOne(id);

    notification.status = NotificationStatus.SENT;
    notification.sent_at = new Date();

    return await this.notificationsRepository.save(notification);
  }

  async markAsFailed(id: string): Promise<Notification> {
    const notification = await this.findOne(id);

    notification.status = NotificationStatus.FAILED;

    return await this.notificationsRepository.save(notification);
  }
}
