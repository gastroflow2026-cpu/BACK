import {
  IsString,
  IsEmail,
  IsInt,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class newReservation {
  @ApiProperty({ example: 'uuid-de-la-mesa' })
  @IsUUID()
  @IsNotEmpty()
  table_id!: string;

  @ApiProperty({ example: 'Marcelo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  customer_name!: string;

  @ApiProperty({ example: 'marcelo@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  customer_email!: string;

  @ApiProperty({ example: 1123456789 })
  @IsInt()
  @Min(1000000)
  @Max(99999999999)
  customer_phone!: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  @IsNotEmpty()
  reservation_date!: Date;

  @ApiProperty({ example: '2025-12-31T20:00:00' })
  @IsDateString()
  @IsNotEmpty()
  start_time!: Date;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  guests_count!: number;

  @ApiPropertyOptional({ example: 'Ventana con vista al jardín, sin TACC' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes!: string;

  @ApiPropertyOptional({ example: 500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  deposit_amount!: number;
}
