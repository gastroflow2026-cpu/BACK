import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

export class CreateNotificationDto {
  @IsUUID()
  restaurant_id!: string;

  @IsUUID()
  user_id!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsUUID()
  restaurant_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
