import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { newReservation } from './dto/reservation.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';

@ApiBearerAuth()
@Controller('restaurants/:restaurantId/reservations')
export class ReservationsController {
    
    constructor(private readonly reservationsService: ReservationsService){}

    
    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @ApiOperation({ summary: 'Obtener todas las reservas de un restaurante' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Reservas obtenidas correctamente' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'No se encontraron reservas' })
    @Get('AllReservations')
    async AllReservations(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, ){
        return await this.reservationsService.AllReservations(restaurantId);
    } 

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Crear una nueva reserva' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiBody({ type: newReservation })
    @ApiResponse({ status: 201, description: 'Reserva creada correctamente' })
    @ApiResponse({ status: 400, description: 'Mesa no disponible o datos inválidos' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Restaurante, mesa o usuario no encontrado' })
    @Post('newReservation')
    async newReservation(
        @Param('restaurantId', ParseUUIDPipe) restaurantId: string, 
        @Body() reservationData: newReservation, 
        @Req() req) {
        const userId = req.user.id
        return await this.reservationsService.createNewReservation(restaurantId, reservationData, userId)
    } 

    
    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Cancelar una reserva' })
    @ApiParam({ name: 'restaurantId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'reservationId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Reserva cancelada correctamente' })
    @ApiResponse({ status: 400, description: 'La reserva ya está cancelada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Acceso denegado' })
    @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
    @Patch(':reservationId/cancel')
    cancelReservation(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ) {
    return this.reservationsService.cancelReservation(restaurantId, reservationId);
    }

}