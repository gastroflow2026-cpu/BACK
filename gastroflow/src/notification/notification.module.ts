import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationLog } from './entities/notification-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, Notification, User, Restaurant]),
    MailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
