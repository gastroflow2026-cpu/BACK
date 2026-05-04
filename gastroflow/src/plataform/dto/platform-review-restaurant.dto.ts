import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RestaurantVerificationStatus } from '../../common/restaurant-verification-status.enum';

export class PlatformReviewRestaurantDto {
  @IsEnum(RestaurantVerificationStatus)
  status!: RestaurantVerificationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
