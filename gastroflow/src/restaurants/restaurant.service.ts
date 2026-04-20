import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

export const restaurantsSeed = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Bella Vita',
    slug: 'bella-vita',
    phone: '+54 11 4321-0000',
    email: 'contacto@bellavita.com',
    address: 'Av. Santa Fe 1234',
    city: 'Buenos Aires',
    country: 'Argentina',
    logo_url: undefined,
    description: 'Restaurante italiano auténtico en el corazón de Palermo.',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'El Asador',
    slug: 'el-asador',
    phone: '+54 11 5678-0000',
    email: 'contacto@elasador.com',
    address: 'Av. Corrientes 5678',
    city: 'Buenos Aires',
    country: 'Argentina',
    logo_url: undefined,
    description: 'Parrilla argentina con los mejores cortes de carne.',
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Sushi Zen',
    slug: 'sushi-zen',
    phone: '+54 11 9999-0000',
    email: 'contacto@sushizen.com',
    address: 'Av. del Libertador 910',
    city: 'Buenos Aires',
    country: 'Argentina',
    logo_url: undefined,
    description: 'Cocina japonesa con ingredientes frescos y técnica tradicional.',
    is_active: true,
  },
];

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
    const restaurant = await this.restaurantRepository.find({
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

    if (!restaurant || restaurant.length === 0) {
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

  // restaurants.seed.ts
async seedRestaurants() {
  const existing = await this.restaurantRepository.count();
  if (existing > 0) throw new BadRequestException('Ya existen restaurantes cargados');

  for (const r of restaurantsSeed) {
    await this.restaurantRepository
      .createQueryBuilder()
      .insert()
      .into(Restaurant)
      .values(r)
      .execute();
  }

  return {
    message: 'Seed de restaurantes creado correctamente',
    restaurantsCreated: restaurantsSeed.length,
  };
}

}
