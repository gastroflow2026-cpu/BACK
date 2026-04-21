import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'La Parrilla del Sol' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'la-parrilla-del-sol' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ example: '+54 11 8888-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@laparrilladelsol.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Belgrano, CABA' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @ApiPropertyOptional({ example: 'Buenos Aires' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Argentina' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'El auténtico asado criollo.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Parrilla' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 4.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9.99)
  rating?: number;

  @ApiPropertyOptional({ example: 'https://cdn/image.png' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @ApiPropertyOptional({ example: 'Selección de cortes premium...' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}
