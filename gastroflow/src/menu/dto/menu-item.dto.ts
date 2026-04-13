import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuItemStatus } from '../../common/menu.enum';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Hamburguesa BBQ' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Carne, queso cheddar y salsa BBQ',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 28900 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'uuid-de-categoria' })
  @IsUUID()
  category_id!: string;

  @ApiPropertyOptional({ example: 'uuid-del-restaurante' })
  @IsOptional()
  @IsUUID()
  restaurant_id?: string;

  @ApiPropertyOptional({
    example: 'https://cdn/menu/hamburguesa.jpg',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 'gluten,lactosa' })
  @IsOptional()
  @IsString()
  allergens?: string;

  @ApiPropertyOptional({ example: 'bestseller,picante' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prep_time_minutes?: number;

  @ApiPropertyOptional({
    enum: MenuItemStatus,
    example: MenuItemStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
