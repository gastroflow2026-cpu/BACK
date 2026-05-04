import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { GetUser } from '../decorators/get-user.decorator';
import { ReservationStatus } from '../common/reservation.enum';
import { UserRole } from '../common/user.enums';
import { CashierReservationsQueryDto } from './dto/cashier-reservations-query.dto';
import { ReservationsService } from './reservations.service';

type AuthenticatedUser = {
  id: string;
  restaurant_id?: string | null;
};

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations/cashier')
export class ReservationsCashierController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CASHIER, UserRole.REST_ADMIN)
  @ApiOperation({
    summary: 'Obtener reservas del restaurante para dashboard de cajero',
  })
  @ApiQuery({ name: 'date', required: false, description: 'Formato YYYY-MM-DD' })
  @ApiQuery({ name: 'status', required: false, enum: ReservationStatus })
  @ApiResponse({ status: 200, description: 'Reservas obtenidas correctamente' })
  @Get()
  async getCashierReservations(
    @GetUser() user: AuthenticatedUser,
    @Query() query: CashierReservationsQueryDto,
  ) {
    const restaurantId = this.requireRestaurantId(user);
    return this.reservationsService.getCashierReservations(restaurantId, query);
  }

  private requireRestaurantId(user: AuthenticatedUser): string {
    if (!user?.restaurant_id) {
      throw new BadRequestException(
        'No se puede determinar el restaurante del usuario',
      );
    }

    return user.restaurant_id;
  }
}
