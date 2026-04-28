import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RestaurantTablesService } from './restaurant_tables.service';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { RolesGuard } from '../auth/guards/Role.guard';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateTableDto } from './dto/restaurant_table.dto';

@ApiBearerAuth()
@Controller('restaurants/:restaurantId/tables')
export class RestaurantTablesController {

    constructor(private readonly restaurantTablesService: RestaurantTablesService){}


    @ApiOperation({ summary: 'Obtener todas las mesas de un restaurante' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Mesas obtenidas correctamente' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'No se encontraron mesas' })
    @Get('availableTables')
    async getAvailableTables(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date: string,
    @Query('time') time: string,
    ) {
    return this.restaurantTablesService.getAvailableTables(restaurantId, date, time);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Marcar una mesa como ocupada' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Mesa marcada como ocupada' })
    @ApiResponse({ status: 400, description: 'La mesa ya está ocupada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
    @Patch(':tableId/occupy')
    async setOccupied(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
     return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.OCUPPED);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Marcar una mesa como reservada' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Mesa marcada como reservada' })
    @ApiResponse({ status: 400, description: 'La mesa ya está reservada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
    @Patch(':tableId/reserve')
    async setReserved(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
    return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.RESERVED);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Marcar una mesa como disponible' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Mesa marcada como disponible' })
    @ApiResponse({ status: 400, description: 'La mesa ya está disponible' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
    @Patch(':tableId/release')
    async setAvailable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
    return await this.restaurantTablesService.updateStatus(restaurantId, tableId, RestaurantTableStatus.AVAILABLE);
}

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Cargar mesas de prueba para un restaurante' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Mesas cargadas correctamente' })
    @ApiResponse({ status: 400, description: 'El restaurante ya tiene mesas cargadas' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Restaurante no encontrado' })
    @Post('seed')
    async seedTables(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return await this.restaurantTablesService.seedTables(restaurantId);
    }

    
    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Crear una nueva mesa' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiBody({ type: CreateTableDto })
    @ApiResponse({ status: 201, description: 'Mesa creada correctamente' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Restaurante no encontrado' })
    @Post('newTable')
    async createNewTable(
        @Param('restaurantId', ParseUUIDPipe) restaurantId: string, 
        @Body() newTableData: CreateTableDto
    ) {
    return await this.restaurantTablesService.createNewTable(restaurantId, newTableData);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Desactivar una mesa' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Mesa desactivada correctamente' })
    @ApiResponse({ status: 400, description: 'La mesa ya está desactivada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
    @Patch(':tableId/deactivate')
    async deactivateTable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    ) {
        return this.restaurantTablesService.deactivateTable(restaurantId, tableId);
    }
}
