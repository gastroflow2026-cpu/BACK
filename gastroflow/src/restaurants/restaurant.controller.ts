import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  //* Obtener perfil interno del restaurante del usuario autenticado
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @Get('profile')
  getProfile(@Req() req) {
    return this.restaurantService.getProfile(req.user.restaurant_id);
  }

  //* Endpoint publico singular para landing
  @Get('public')
  getPublicRestaurant() {
    return this.restaurantService.getPublicRestaurant();
  }

  //* Endpoint publico para listado de restaurantes
  @Get('public/all')
  getPublicRestaurants() {
    return this.restaurantService.getPublicRestaurants();
  }

  //* Actualizar perfil del restaurante del usuario autenticado
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @Patch('profile')
  updateProfile(@Body() dto: UpdateRestaurantDto, @Req() req) {
    return this.restaurantService.updateProfile(req.user.restaurant_id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN)
  @Post('seed')
  async seedRestaurants() {
    return await this.restaurantService.seedRestaurants();
  }
}
