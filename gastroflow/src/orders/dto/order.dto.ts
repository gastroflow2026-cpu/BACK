import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { OrderStatus } from "../../common/order.enum";

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
    name!:string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;

    @IsString()
    @MaxLength(100)
    notes?: string;
}

export class UpdateOrderDto {
  status?: OrderStatus;
}