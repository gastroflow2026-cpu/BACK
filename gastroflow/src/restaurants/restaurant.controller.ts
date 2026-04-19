import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UpdateRestaurantDto } from './dto/restaurant.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';

@ApiBearerAuth()
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


  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN)
  @Post('seed')
  async seedRestaurants() {
    return await this.restaurantService.seedRestaurants();
  }
}
