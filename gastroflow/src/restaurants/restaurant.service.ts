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
  //*Obtener el restaurante principal (single-tenant por ahora)
  async getProfile() {
    const restaurant = await this.restaurantRepository.findOne({
      where: { is_active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('No existe restaurante configurado');
    }
    return restaurant;
  }

  //*Actualizar perfil del Restaurante
  async updateProfile(dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.getProfile();

    Object.assign(restaurant, dto);

    return await this.restaurantRepository.save(restaurant);
  }
}
