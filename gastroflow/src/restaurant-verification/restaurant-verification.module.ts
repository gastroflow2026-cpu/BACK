import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { CloudinaryConfig } from '../config/cloudinary';
import { RestaurantVerificationDocument } from './entities/restaurant-verification-document.entity';
import { RestaurantVerificationController } from './restaurant-verification.controller';
import { RestaurantVerificationRepository } from './restaurant-verification.repository';
import { RestaurantVerificationService } from './restaurant-verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantVerificationDocument, Restaurant]),
  ],
  controllers: [RestaurantVerificationController],
  providers: [
    RestaurantVerificationService,
    RestaurantVerificationRepository,
    CloudinaryConfig,
  ],
  exports: [RestaurantVerificationService],
})
export class RestaurantVerificationModule {}