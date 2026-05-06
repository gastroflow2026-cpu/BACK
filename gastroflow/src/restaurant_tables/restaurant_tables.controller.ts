import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantTablesService } from './restaurant_tables.service';
import { RestaurantTableStatus } from '../common/restaurant_table.enum';
import { GetUser } from '../decorators/get-user.decorator';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { RolesGuard } from '../auth/guards/Role.guard';
import { AuthGuard } from '../auth/guards/Auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AssignWaiterToTableDto,
  CreateTableDto,
  UpdateTableDto,
  UpdateTablesLayoutDto,
} from './dto/restaurant_table.dto';

@ApiBearerAuth()
@Controller('restaurants/:restaurantId/tables')
export class RestaurantTablesController {
  constructor(
    private readonly restaurantTablesService: RestaurantTablesService,
  ) {}

  private validateRestaurantAccess(
    req: { user?: { restaurant_id?: string } },
    restaurantId: string,
  ) {
    if (req.user?.restaurant_id !== restaurantId) {
      throw new ForbiddenException(
        'No tienes permiso para administrar mesas de este restaurante',
      );
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.WAITER)
  @ApiOperation({ summary: 'Obtener mesas asignadas al mozo autenticado' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Mesas asignadas obtenidas correctamente' })
  @Get('my-assigned')
  async getMyAssignedTables(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @GetUser() user: { id: string; restaurant_id?: string },
    @Query('date') date?: string,
    @Query('time') time?: string,
  ) {
    this.validateRestaurantAccess(
      { user: { restaurant_id: user.restaurant_id } },
      restaurantId,
    );

    return this.restaurantTablesService.getWaiterAssignedTables(
      restaurantId,
      user.id,
      date,
      time,
    );
  }

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
    return this.restaurantTablesService.getAvailableTables(
      restaurantId,
      date,
      time,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar mesas con mozo asignado' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asignaciones obtenidas correctamente' })
  @Get('assignments')
  async getTablesAssignments(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return this.restaurantTablesService.getTablesAssignments(restaurantId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar mozos activos del restaurante' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Mozos obtenidos correctamente' })
  @Get('waiters')
  async getRestaurantWaiters(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return this.restaurantTablesService.getRestaurantWaiters(restaurantId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Asignar un mozo a una mesa' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
  @ApiBody({ type: AssignWaiterToTableDto })
  @ApiResponse({ status: 200, description: 'Mozo asignado correctamente' })
  @Patch(':tableId/assign-waiter')
  async assignWaiterToTable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Body() dto: AssignWaiterToTableDto,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return this.restaurantTablesService.assignWaiterToTable(
      restaurantId,
      tableId,
      dto,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Quitar mozo asignado de una mesa' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Asignación removida correctamente' })
  @Patch(':tableId/unassign-waiter')
  async unassignWaiterFromTable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return this.restaurantTablesService.unassignWaiterFromTable(
      restaurantId,
      tableId,
    );
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
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.updateStatus(
      restaurantId,
      tableId,
      RestaurantTableStatus.OCUPPED,
    );
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
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.updateStatus(
      restaurantId,
      tableId,
      RestaurantTableStatus.RESERVED,
    );
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
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.updateStatus(
      restaurantId,
      tableId,
      RestaurantTableStatus.AVAILABLE,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
  @ApiOperation({ summary: 'Cargar mesas de prueba para un restaurante' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Mesas cargadas correctamente' })
  @ApiResponse({
    status: 400,
    description: 'El restaurante ya tiene mesas cargadas',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Restaurante no encontrado' })
  @Post('seed')
  async seedTables(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
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
    @Body() newTableData: CreateTableDto,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.createNewTable(
      restaurantId,
      newTableData,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
  @ApiOperation({ summary: 'Actualizar layout de varias mesas' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateTablesLayoutDto })
  @ApiResponse({
    status: 200,
    description: 'Layout de mesas actualizado correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({
    status: 404,
    description: 'Una o mas mesas no fueron encontradas',
  })
  @Patch('layout')
  async updateTablesLayout(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() layoutData: UpdateTablesLayoutDto,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.updateTablesLayout(
      restaurantId,
      layoutData,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de una mesa' })
  @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'tableId', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateTableDto })
  @ApiResponse({ status: 200, description: 'Mesa actualizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @Patch(':tableId')
  async updateTable(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Body() tableData: UpdateTableDto,
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return await this.restaurantTablesService.updateTable(
      restaurantId,
      tableId,
      tableData,
    );
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
    @Req() req: { user?: { restaurant_id?: string } },
  ) {
    this.validateRestaurantAccess(req, restaurantId);
    return this.restaurantTablesService.deactivateTable(restaurantId, tableId);
  }
}
