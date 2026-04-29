import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PlatformReviewRestaurantDto {
  @ApiPropertyOptional({
    example: 'Documentación validada correctamente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}