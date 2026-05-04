import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import {
  NotificationLog,
  NotificationLogStatus,
  NotificationLogType,
} from '../notification/entities/notification-log.entity';

@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,

    private readonly mailService: MailService,
  ) {}

  // CRON (RECORDATORIOS)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleSubscriptionReminders() {
    this.logger.log('Running subscription reminders cron...');

    await this.createReminderLogs();
    await this.processPendingLogs();
  }

  //  CRON (SUSPENSIÓN AUTOMÁTICA)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiredSubscriptions() {
    this.logger.log('Running expired subscriptions cron...');

    const today = new Date();

    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        end_date: LessThan(today),
        status: SubscriptionStatus.ACTIVE,
      },
      relations: {
        restaurant: true,
      },
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.CANCELLED;

      await this.subscriptionRepository.save(subscription);

      const email = subscription.restaurant?.email;

      if (!email) continue;

      await this.mailService.sendGenericNotification(
        email,
        'Suscripción cancelada por vencimiento',
        'Tu suscripción ha sido cancelada automáticamente porque llegó a su fecha de vencimiento. Puedes renovarla para seguir usando GastroFlow.',
      );

      this.logger.log(
        `Expired subscription cancelled and notified: ${subscription.id}`,
      );
    }
  }

  // =========================
  // LÓGICA RECORDATORIOS
  // =========================

  private async createReminderLogs() {
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + 7);

    const subscriptions: Subscription[] =
      await this.subscriptionRepository.find({
        where: {
          next_payment_date: Between(today, reminderDate),
          status: SubscriptionStatus.ACTIVE,
        },
        relations: {
          restaurant: true,
        },
      });

    for (const subscription of subscriptions) {
      const email = subscription.restaurant?.email;

      if (!email || !subscription.next_payment_date) continue;

      const log = this.notificationLogRepository.create({
        type: NotificationLogType.SUBSCRIPTION_REMINDER,
        target_id: subscription.id,
        recipient_email: email,
        scheduled_for: subscription.next_payment_date,
        status: NotificationLogStatus.PENDING,
      });

      try {
        await this.notificationLogRepository.save(log);
      } catch {
        this.logger.warn(
          `Duplicate reminder skipped for subscription ${subscription.id}`,
        );
      }
    }
  }

  private async processPendingLogs() {
    const now = new Date();

    const logs = await this.notificationLogRepository.find({
      where: [
        {
          status: NotificationLogStatus.PENDING,
        },
        {
          status: NotificationLogStatus.FAILED,
          next_retry_at: LessThanOrEqual(now),
        },
      ],
      take: 50,
      order: {
        created_at: 'ASC',
      },
    });

    for (const log of logs) {
      if (log.attempts >= log.max_attempts) {
        this.logger.warn(`Max attempts reached for notification log ${log.id}`);
        continue;
      }

      try {
        await this.mailService.sendGenericNotification(
          log.recipient_email,
          'Recordatorio de suscripción',
          'Tu suscripción está próxima a renovarse.',
        );

        log.status = NotificationLogStatus.SENT;
        log.sent_at = new Date();
        log.error_message = null;
        log.next_retry_at = null;

        await this.notificationLogRepository.save(log);
        this.logger.log(`Subscription reminder sent to ${log.recipient_email}`);
      } catch (error) {
        log.attempts += 1;
        log.status = NotificationLogStatus.FAILED;
        log.error_message =
          error instanceof Error ? error.message : 'Unknown error';

        const retryMinutes = log.attempts * 15;
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + retryMinutes);

        log.next_retry_at = nextRetry;

        await this.notificationLogRepository.save(log);
      }
    }
  }
}
