import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantVerificationDocument } from '../restaurant-verification/entities/restaurant-verification-document.entity';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantVerificationDocument,
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}