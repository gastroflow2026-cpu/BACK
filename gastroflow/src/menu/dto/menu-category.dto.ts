import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuCategoryDto {
  @ApiProperty({ example: 'Platos fuertes' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Opciones principales del menú' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-del-restaurante' })
  @IsOptional()
  @IsUUID()
  restaurant_id?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}

export class UpdateMenuCategoryDto extends PartialType(CreateMenuCategoryDto) {}
