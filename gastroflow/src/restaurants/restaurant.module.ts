import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantTheme } from '../restaurant-theme/entities/restaurant-theme.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, RestaurantTheme])],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
