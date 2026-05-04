import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdateKitchenOrderStatusDto } from './dto/kitchen-order.dto';
import { OrderService } from './order.service';
import { AddItemDto, OpenOrderDto, PayOrderDto } from './dto/order.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '../common/user.enums';
import { GetUser } from '../decorators/get-user.decorator';

type AuthenticatedUser = {
  id: string;
  restaurant_id?: string;
};

@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Waiter
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Post('open')
  async openOrder(
    @Body() dto: OpenOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.openOrder(dto.tableId, user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Post(':orderId/items')
  async addItemToOrder(
    @Param('orderId') orderId: string,
    @Body() dto: AddItemDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.addItemToOrder(orderId, dto, user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Patch(':orderId/close')
  async closeOrder(
    @Param('orderId') orderId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.closeOrder(orderId, user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Patch(':orderId/confirm-delivery')
  async confirmOrderDelivery(
    @Param('orderId') orderId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.confirmOrderDelivery(orderId, user.id);
  }

  // Shared
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER, UserRole.CHEF, UserRole.CASHIER)
  @Get('table/:tableId')
  async getOrdersByTable(@Param('tableId') tableId: string) {
    return this.orderService.getOrdersByTable(tableId);
  }

  // Kitchen
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CHEF)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDIENTE', 'PREPARACION', 'SERVIDO'],
  })
  @Get('kitchen')
  async getKitchenOrders(
    @GetUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    if (!user?.restaurant_id)
      throw new Error('No se puede determinar el restaurante del usuario');
    return this.orderService.getKitchenOrders(user.restaurant_id, status);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CHEF)
  @Get('kitchen/:orderId')
  async getKitchenOrderById(@Param('orderId') orderId: string) {
    return this.orderService.getKitchenOrderById(orderId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CHEF)
  @Patch('kitchen/:orderId/status')
  async updateKitchenOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateKitchenOrderStatusDto,
  ) {
    return this.orderService.updateKitchenOrderStatus(orderId, dto.status);
  }

  // Cashier
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CASHIER)
  @Get('cashier')
  async getCashierOrders(@GetUser() user: AuthenticatedUser) {
    if (!user?.restaurant_id)
      throw new Error('No se puede determinar el restaurante del usuario');
    return this.orderService.getCashierOrders(user.restaurant_id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CASHIER)
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Formato YYYY-MM-DD',
  })
  @Get('cashier/daily-summary')
  async getCashierDailySummary(
    @GetUser() user: AuthenticatedUser,
    @Query('date') date?: string,
  ) {
    if (!user?.restaurant_id)
      throw new Error('No se puede determinar el restaurante del usuario');
    return this.orderService.getCashierDailySummary(user.restaurant_id, date);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.CASHIER)
  @Patch(':orderId/pay')
  async payOrder(
    @Param('orderId') orderId: string,
    @Body() dto: PayOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.payOrder(orderId, dto, user.id);
  }
}
