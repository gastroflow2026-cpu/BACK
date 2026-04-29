import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantVerificationDocument } from '../restaurant-verification/entities/restaurant-verification-document.entity';
import { RestaurantVerificationStatus } from '../common/restaurant-verification-status.enum';
import { PlatformReviewRestaurantDto } from './dto/platform-review-restaurant.dto';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantVerificationDocument)
    private readonly documentRepository: Repository<RestaurantVerificationDocument>,
  ) {}

  async getPendingRestaurants() {
    return await this.restaurantRepository.find({
      where: {
        verification_status: RestaurantVerificationStatus.PENDING,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getRestaurantReviewDetail(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const documents = await this.documentRepository.find({
      where: {
        restaurant_id: restaurant.id,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return {
      restaurant,
      documents,
    };
  }

  async approveRestaurant(
    restaurantId: string,
    platformUserId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantOrFail(restaurantId);

    restaurant.is_active = true;
    restaurant.verification_status = RestaurantVerificationStatus.APPROVED;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = platformUserId;

    return await this.restaurantRepository.save(restaurant);
  }

  async rejectRestaurant(
    restaurantId: string,
    platformUserId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantOrFail(restaurantId);

    restaurant.is_active = false;
    restaurant.verification_status = RestaurantVerificationStatus.REJECTED;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = platformUserId;

    return await this.restaurantRepository.save(restaurant);
  }

  async suspendRestaurant(
    restaurantId: string,
    platformUserId: string,
    dto: PlatformReviewRestaurantDto,
  ) {
    const restaurant = await this.findRestaurantOrFail(restaurantId);

    restaurant.is_active = false;
    restaurant.verification_status = RestaurantVerificationStatus.SUSPENDED;
    restaurant.verification_notes = dto.notes ?? null;
    restaurant.verified_at = new Date();
    restaurant.verified_by_user_id = platformUserId;

    return await this.restaurantRepository.save(restaurant);
  }

  private async findRestaurantOrFail(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    return restaurant;
  }
  async getRestaurants(status?: RestaurantVerificationStatus) {
    return await this.restaurantRepository.find({
      where: status
        ? {
            verification_status: status,
          }
        : {},
      order: {
        created_at: 'DESC',
      },
    });
  }
}
