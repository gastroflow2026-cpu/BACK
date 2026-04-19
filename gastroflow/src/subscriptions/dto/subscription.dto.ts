import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PlanType } from '../enums/plan-type.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class CreateSubscriptionDto {
  @IsUUID()
  restaurant_id!: string;

  @IsEnum(PlanType)
  plan_type!: PlanType;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsDateString()
  next_payment_date?: string;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(PlanType)
  plan_type?: PlanType;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  next_payment_date?: string;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;
}
