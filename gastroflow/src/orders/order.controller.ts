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
import { AddItemDto, OpenOrderDto, UpdateOrderDto } from './dto/order.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '../common/user.enums';
import { GetUser } from '../decorators/get-user.decorator';

type AuthenticatedUser = {
  id: string;
};

@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Post('open')
  async openOrder(
    @Body() dto: OpenOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const waiterId = user.id;
    return await this.orderService.openOrder(dto.tableId, waiterId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Post(':orderId/items')
  async addItemToOrder(
    @Param('orderId') orderId: string,
    @Body() orderItems: AddItemDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.addItemToOrder(orderId, orderItems, user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @Patch(':orderId')
  async updateOrder(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.orderService.updateOrder(orderId, dto, user.id);
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
  @Role(UserRole.CHEF)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pendiente', 'preparacion', 'servido'],
  })
  @Get('kitchen')
  async getKitchenOrders(@Query('status') status?: string) {
    return this.orderService.getKitchenOrders(status);
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
}
