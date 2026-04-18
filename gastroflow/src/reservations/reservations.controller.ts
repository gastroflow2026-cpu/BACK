import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { newReservation } from './dto/reservation.dto';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';

@ApiBearerAuth()
@Controller('restaurants/:restaurantId/reservations')
export class ReservationsController {
    
    constructor(private readonly reservationsService: ReservationsService){}

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.REST_ADMIN)
    @Get('AllReservations')
    async AllReservations(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, ){
        return await this.reservationsService.AllReservations(restaurantId);
    } 

    @UseGuards(AuthGuard, RolesGuard)
    @Role(UserRole.CUSTOMER)
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
    @Patch(':reservationId/cancel')
    cancelReservation(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ) {
    return this.reservationsService.cancelReservation(restaurantId, reservationId);
    }

}