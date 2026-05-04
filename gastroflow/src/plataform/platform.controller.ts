import {
  Body,
  Controller,
  Get,
  Query,
  ParseEnumPipe,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { PlatformService } from './platform.service';
import { PlatformReviewRestaurantDto } from './dto/platform-review-restaurant.dto';
import { RestaurantVerificationStatus } from '../common/restaurant-verification-status.enum';

@ApiTags('Platform')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.SUPER_ADMIN)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}
  @Get('restaurants')
  @ApiOperation({
    summary: 'Listar restaurantes registrados en la plataforma',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RestaurantVerificationStatus,
  })
  getRestaurants(@Query('status') status?: RestaurantVerificationStatus) {
    return this.platformService.getRestaurants(status);
  }

  @Get('restaurants/pending')
  @ApiOperation({
    summary: 'Listar restaurantes pendientes de revisión',
  })
  getPendingRestaurants() {
    return this.platformService.getPendingRestaurants();
  }

  @Get('subscriptions/active')
  @ApiOperation({
    summary: 'Listar suscripciones activas de restaurantes',
  })
  getActiveSubscriptions() {
    return this.platformService.getActiveSubscriptions();
  }

  @Get('revenue/subscriptions')
  @ApiOperation({
    summary: 'Obtener métricas de ingresos por suscripciones de restaurantes',
  })
  getSubscriptionRevenueMetrics() {
    return this.platformService.getSubscriptionRevenueMetrics();
  }

  @Get('restaurants/:id')
  @ApiOperation({
    summary: 'Obtener detalle de restaurante y documentos',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del restaurante',
  })
  getRestaurantReviewDetail(@Param('id', ParseUUIDPipe) restaurantId: string) {
    return this.platformService.getRestaurantReviewDetail(restaurantId);
  }

  @Patch('restaurants/:id/approve')
  @ApiOperation({
    summary: 'Aprobar y activar restaurante',
  })
  approveRestaurant(
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @Body() dto: PlatformReviewRestaurantDto,
    @Req() req,
  ) {
    return this.platformService.approveRestaurant(
      restaurantId,
      req.user.id,
      dto,
    );
  }

  @Patch('restaurants/:id/reject')
  @ApiOperation({
    summary: 'Rechazar solicitud de restaurante',
  })
  rejectRestaurant(
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @Body() dto: PlatformReviewRestaurantDto,
    @Req() req,
  ) {
    return this.platformService.rejectRestaurant(
      restaurantId,
      req.user.id,
      dto,
    );
  }

  @Patch('restaurants/:id/suspend')
  @ApiOperation({
    summary: 'Suspender restaurante',
  })
  suspendRestaurant(
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @Body() dto: PlatformReviewRestaurantDto,
    @Req() req,
  ) {
    return this.platformService.suspendRestaurant(
      restaurantId,
      req.user.id,
      dto,
    );
  }
}
