import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @ApiProperty({
    example: 84500,
    description: 'Monto de efectivo declarado por cajero al cierre',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredClosingAmount!: number;

  @ApiPropertyOptional({ example: 'Sin diferencias relevantes en arqueo.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
