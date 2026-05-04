import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ReservationStatus } from '../../common/reservation.enum';

export class CashierReservationsQueryDto {
  @ApiPropertyOptional({
    example: '2026-05-04',
    description: 'Fecha de consulta en formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
