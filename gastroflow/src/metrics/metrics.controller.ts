import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { GetUser } from '../decorators/get-user.decorator';
import { UserRole } from '../common/user.enums';
import type { JwtPayload } from '../interface/jwt-payload.interface';
import { MetricsService } from './metrics.service';
import { MetricsQueryDto } from './dto/metrics-query.dto';

@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.REST_ADMIN)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  private getRestaurantId(user: JwtPayload): string {
    const restaurantId = user.restaurantId ?? user.restaurant_id;
    if (!restaurantId) {
      throw new BadRequestException(
        'El token no contiene restaurant_id asociado',
      );
    }

    return restaurantId;
  }

  /**
   * GET /metrics/summary?period=day|week|month&date=YYYY-MM-DD
   * Resumen de ventas: total, pedidos, ticket promedio + deltas vs período anterior
   */
  @Get('summary')
  getSummary(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getSummary(this.getRestaurantId(user), query);
  }

  /**
   * GET /metrics/sales?period=...
   * Desglose por método de pago + ventas por día de la semana
   */
  @Get('sales')
  async getSales(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
  ) {
    const restaurantId = this.getRestaurantId(user);
    const [byPaymentMethod, byDayOfWeek] = await Promise.all([
      this.metricsService.getSalesByPaymentMethod(restaurantId, query),
      this.metricsService.getSalesByDayOfWeek(restaurantId, query),
    ]);

    return { byPaymentMethod, byDayOfWeek };
  }

  /**
   * GET /metrics/orders/status
   * Cantidad de pedidos agrupados por estado (activos hoy)
   */
  @Get('orders/status')
  getOrdersByStatus(@GetUser() user: JwtPayload) {
    return this.metricsService.getOrdersByStatus(this.getRestaurantId(user));
  }

  /**
   * GET /metrics/orders/avg-time?period=...
   * Tiempo promedio de atención en minutos
   */
  @Get('orders/avg-time')
  getAvgOrderTime(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getAvgOrderTime(this.getRestaurantId(user), query);
  }

  /**
   * GET /metrics/tables/occupancy
   * Mesas totales / ocupadas / libres / tasa de ocupación
   */
  @Get('tables/occupancy')
  getTablesOccupancy(@GetUser() user: JwtPayload) {
    return this.metricsService.getTablesOccupancy(this.getRestaurantId(user));
  }

  /**
   * GET /metrics/reservations/today?period=...
   * Reservas del período por estado
   */
  @Get('reservations/today')
  getReservationsToday(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getReservationsToday(this.getRestaurantId(user), query);
  }

  /**
   * GET /metrics/menu/top-items?period=...&limit=5
   * Top items del menú por unidades vendidas
   */
  @Get('menu/top-items')
  getTopMenuItems(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.metricsService.getTopMenuItems(
      this.getRestaurantId(user),
      query,
      limit,
    );
  }

  /**
   * GET /metrics/staff/performance?period=...
   * Rendimiento de mozos: pedidos atendidos, ventas totales, ticket promedio
   */
  @Get('staff/performance')
  getStaffPerformance(
    @GetUser() user: JwtPayload,
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getStaffPerformance(
      this.getRestaurantId(user),
      query,
    );
  }
}
