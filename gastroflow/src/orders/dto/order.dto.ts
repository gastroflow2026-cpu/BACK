import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../common/order.enum';

export class OpenOrderDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  tableId!: string;
}

export class AddItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsString()
  @MaxLength(60)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  notes?: string;
}

export class PayOrderDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
