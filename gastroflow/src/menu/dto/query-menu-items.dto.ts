import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MenuItemStatus } from '../../common/menu.enum';

export class QueryMenuItemsDto {
  @ApiPropertyOptional({ example: 'uuid-de-categoria' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'bestseller' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 'gluten' })
  @IsOptional()
  @IsString()
  allergen?: string;

  @ApiPropertyOptional({
    enum: MenuItemStatus,
    example: MenuItemStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;

  @ApiPropertyOptional({
    example: 'public',
    description: 'public | admin',
  })
  @IsOptional()
  @IsString()
  view?: 'public' | 'admin';
}
