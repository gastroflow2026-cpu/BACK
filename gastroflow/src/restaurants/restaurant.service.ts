import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

export const restaurantsSeed = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Bella Vita',
    slug: 'bella-vita',
    phone: '+54 11 4321-0000',
    email: 'contacto@bellavita.com',
    address: 'Av. Santa Fe 1234, Palermo',
    city: 'Buenos Aires',
    country: 'Argentina',
    description: "Pastas artesanales y ambiente romano.",
    category: 'Italiana',
    rating: 0,
    image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop",
    about: "La Bella Vita ofrece una experiencia italiana auténtica en el corazón de Palermo. Con pastas amasadas a mano y recetas transmitidas por generaciones, cada plato es un viaje a las raíces de Italia.",
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: "Sushi Master",
    slug: 'sushi-master',
    phone: '+54 11 5678-0000',
    email: 'contacto@sushimaster.com',
    address: 'Av. Corrientes 5678, Recoleta',
    city: 'Buenos Aires',
    country: 'Argentina',
    description: "Sabor de Tokyo con toques locales.",
    category: 'Japonesa',
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop",
    about: "Sushi Master ofrece una experiencia japonesa auténtica en el corazón de Recoleta. Con ingredientes frescos y técnicas tradicionales, cada plato es un viaje a las raíces de Japón.",
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'La Parrilla del Sol',
    slug: 'la-parrilla-del-sol',
    phone: '+54 11 8888-0000',
    email: 'contacto@laparrilladelsol.com',
    description: 'El auténtico asado criollo.',
    address: 'Belgrano, CABA',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Parrilla',
    rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800&auto=format&fit=crop',
    about: 'Selección de cortes premium cocinados a las brasas, acompañados de los mejores vinos de nuestra cava.',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Burger House',
    slug: 'burger-house',
    phone: '+54 11 7777-0000',
    email: 'contacto@burgerhouse.com',
    description: 'Hamburguesas gourmet y cervezas.',
    address: 'Chacarita, CABA',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Hamburguesas',
    rating: 4.5,
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop',
    about: 'El paraíso de los amantes de la carne entre dos panes. Pan de papa casero y blends de carne madurada.',
    is_active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Green Eat',
    slug: 'green-eat',
    phone: '+54 11 6666-0000',
    email: 'contacto@greeneat.com',
    description: 'Comida consciente y natural.',
    address: 'San Telmo, CABA',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Saludable',
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    about: 'Propuestas frescas, estacionales y nutritivas para disfrutar de una comida equilibrada sin perder el sabor.',
    is_active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Tacos El Rey',
    slug: 'tacos-el-rey',
    phone: '+54 11 5555-0000',
    email: 'contacto@tacoselrey.com',
    description: 'Explosión de sabores mexicanos.',
    address: 'Nuñez, CABA',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Mexicana',
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop',
    about: 'Auténtica comida callejera de México: tacos al pastor, cochinita pibil y margaritas artesanales.',
    is_active: true,
  }
];

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  
  //* Obtener restaurante del usuario autenticado
  async getProfile(restaurantId?: string): Promise<Restaurant> {
    const restaurant = await this.findRestaurantById(restaurantId);
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
        description: true,
        category: true,
        rating: true,
        image_url: true,
        about: true,
      },
    });

    if (!restaurant || restaurant.length === 0) {
      throw new NotFoundException('No existe restaurante público configurado');
    }

    return restaurant;
  }

  //* Endpoint publico para listar restaurantes visibles
  async getPublicRestaurants() {
    return await this.restaurantRepository.find({
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
        description: true,
        category: true,
        rating: true,
        image_url: true,
        about: true,
        is_active: true,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  //* Actualizar perfil del restaurante
  async updateProfile(
    restaurantId: string | undefined,
    dto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const restaurant = await this.findRestaurantById(restaurantId);

    Object.assign(restaurant, dto);

    return await this.restaurantRepository.save(restaurant);
  }

  private async findRestaurantById(restaurantId?: string): Promise<Restaurant> {
    if (!restaurantId) {
      throw new BadRequestException(
        'El usuario autenticado no tiene un restaurante vinculado',
      );
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('No existe restaurante configurado');
    }

    return restaurant;
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
