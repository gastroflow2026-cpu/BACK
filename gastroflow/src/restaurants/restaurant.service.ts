import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  //* Obtener restaurante principal (single-tenant por ahora)
  async getProfile(): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { is_active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('No existe restaurante configurado');
    }

    return restaurant;
  }

  //* Endpoint público para landing
  async getPublicRestaurant() {
    const restaurant = await this.restaurantRepository.findOne({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        logo_url: true,
        description: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('No existe restaurante público configurado');
    }

    return restaurant;
  }

  //* Actualizar perfil del restaurante
  async updateProfile(dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.getProfile();

    Object.assign(restaurant, dto);

    return await this.restaurantRepository.save(restaurant);
  }
}
