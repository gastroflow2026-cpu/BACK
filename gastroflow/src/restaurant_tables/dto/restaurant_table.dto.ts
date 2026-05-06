import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RestaurantTableLayoutShape } from '../../common/restaurant_table.enum';

export class CreateTableDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  table_number!: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacity!: number;

  @ApiProperty({ example: 'Terraza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  zone!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  layout_x?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  layout_y?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  layout_width?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  layout_height?: number;

  @ApiPropertyOptional({
    enum: RestaurantTableLayoutShape,
    example: RestaurantTableLayoutShape.SQUARE,
  })
  @IsEnum(RestaurantTableLayoutShape)
  @IsOptional()
  layout_shape?: RestaurantTableLayoutShape;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  layout_rotation?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;
}

export class UpdateTableDto extends PartialType(CreateTableDto) {}

export class AssignWaiterToTableDto {
  @ApiProperty({
    example: '2f2c0ce1-4d23-4ce8-bf7b-87ec1cc9f9fe',
    description: 'ID del mozo a asignar',
  })
  @IsUUID()
  @IsNotEmpty()
  waiter_id!: string;
}

export class UpdateTableLayoutItemDto {
  @ApiProperty({ example: 'uuid-de-la-mesa' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  layout_x!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  layout_y!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  layout_width?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  layout_height?: number;

  @ApiPropertyOptional({
    enum: RestaurantTableLayoutShape,
    example: RestaurantTableLayoutShape.SQUARE,
  })
  @IsEnum(RestaurantTableLayoutShape)
  @IsOptional()
  layout_shape?: RestaurantTableLayoutShape;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  layout_rotation?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;
}

export class UpdateTablesLayoutDto {
  @ApiProperty({ type: [UpdateTableLayoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateTableLayoutItemDto)
  tables!: UpdateTableLayoutItemDto[];
}
