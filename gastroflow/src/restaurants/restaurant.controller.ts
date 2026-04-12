import { ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

@ApiTags('Restaurants')
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  //*Obtener perfil del restaurante
  @Get('profile')
  getProfile() {
    return this.restaurantService.getProfile();
  }

  //* Actualizar perfil
  @Patch('profile')
  updateProfile(@Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateProfile(dto);
  }
}
