import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @ApiProperty({
    example: 50000,
    description: 'Monto inicial de efectivo para apertura de caja',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingAmount!: number;
}
