import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { GetUser } from '../decorators/get-user.decorator';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CashRegisterHistoryQueryDto } from './dto/cash-register-history.dto';

type AuthenticatedUser = {
  id: string;
  restaurant_id?: string | null;
};

@ApiTags('Cash Register')
@ApiBearerAuth()
@Controller('cash-register')
@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.CASHIER)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  @ApiOperation({ summary: 'Abrir caja del cajero' })
  @ApiResponse({ status: 201, description: 'Caja abierta correctamente' })
  @ApiResponse({ status: 400, description: 'Ya existe caja abierta' })
  async open(
    @Body() dto: OpenCashRegisterDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const restaurantId = this.requireRestaurantId(user);
    return this.cashRegisterService.openSession(restaurantId, user.id, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Obtener caja abierta actual del cajero' })
  async getCurrent(@GetUser() user: AuthenticatedUser) {
    const restaurantId = this.requireRestaurantId(user);
    return this.cashRegisterService.getCurrentSession(restaurantId, user.id);
  }

  @Post('close')
  @ApiOperation({ summary: 'Cerrar caja del cajero' })
  async close(
    @Body() dto: CloseCashRegisterDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const restaurantId = this.requireRestaurantId(user);
    return this.cashRegisterService.closeSession(restaurantId, user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de cajas del cajero' })
  async history(
    @Query() query: CashRegisterHistoryQueryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const restaurantId = this.requireRestaurantId(user);
    return this.cashRegisterService.getSessionHistory(
      restaurantId,
      user.id,
      query,
    );
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
