import { Body, Controller, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { AddItemDto, OpenOrderDto, UpdateOrderDto } from "./dto/order.dto";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { RolesGuard } from "../auth/guards/Role.guard";
import { Role } from "../decorators/roles.decorators";
import { ApiBearerAuth } from "@nestjs/swagger";
import { UserRole } from "../common/user.enums";
import { GetUser } from "../decorators/get-user.decorator";

@ApiBearerAuth()
@Controller('order')
export class OrderController{

    constructor(private readonly orderService: OrderService){}

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.WAITER)
    @Post('open')
    async openOrder(
    @Body() dto: OpenOrderDto,
    @Req() req
    ) {
    const waiterId = req.user.id;
        return await this.orderService.openOrder(dto.tableId, waiterId);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.WAITER)
    @Post(':orderId/items')
    async addItemToOrder(
    @Param('orderId') orderId: string,
    @Body() orderItems: AddItemDto,
    @GetUser() user
    ) {
        return this.orderService.addItemToOrder(orderId, orderItems, user.id)
        
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.WAITER)
    @Patch(':orderId')
    async updateOrder(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
    @GetUser() user
    ) {
    return this.orderService.updateOrder(orderId, dto, user.id);
    }


    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.WAITER)
    @Patch(':orderId/close')
    async closeOrder(
    @Param('orderId') orderId: string,
    @GetUser() user
    ) {
        return this.orderService.closeOrder(orderId, user.id);
    }


}