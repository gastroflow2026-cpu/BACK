import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { newReservation } from './dto/reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReservationsService {

    constructor(private reservationsRepository: ReservationsRepository){}

    async AllReservations(restaurantId: string){
        return await this.reservationsRepository.AllReservations(restaurantId);
    } 

    async createNewReservation(restaurantId: string, reservationData: newReservation, userId: string){
       return await this.reservationsRepository.createNewReservation(restaurantId, reservationData, userId)
    }

    async cancelReservation(restaurantId: string, reservationId: string){
        return await this.reservationsRepository.cancelReservation(restaurantId, reservationId)
    }
}
  