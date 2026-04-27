import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from "class-validator";
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
    
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;

    @IsString()
    @Max(50)
    notes?: string;
}

export class UpdateOrderDto {
  status?: OrderStatus;
}