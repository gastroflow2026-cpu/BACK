import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RestaurantTablesService } from './restaurant_tables.service';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { RolesGuard } from '../auth/guards/Role.guard';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('restaurants/:restaurantId/tables')
export class RestaurantTablesController {

    constructor(private readonly restaurantTablesService: RestaurantTablesService){}

    @Get('availableTables')
    async getAvailableTables(@Param('restaurantId') restaurantId: string) {
       return await this.restaurantTablesService.getAvailableTables(restaurantId)
    }

    @Patch(':tableId/occupy')
    async setOccupied(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
     return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.OCUPPED);
    }

    @Patch(':tableId/reserve')
    async setReserved(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
    return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.RESERVED);
    }

    @Patch(':tableId/release')
    async setAvailable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
    return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.AVAILABLE);
}

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @Post('seed')
    async seedTables(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return await this.restaurantTablesService.seedTables(restaurantId);
    }
}
