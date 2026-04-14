import { ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

@ApiTags('Restaurants')
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  //* Obtener perfil interno del restaurante
  @Get('profile')
  getProfile() {
    return this.restaurantService.getProfile();
  }

  //* Endpoint público para landing
  @Get('public')
  getPublicRestaurant() {
    return this.restaurantService.getPublicRestaurant();
  }

  //* Actualizar perfil
  @Patch('profile')
  updateProfile(@Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateProfile(dto);
  }
}
