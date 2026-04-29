import { IsIn } from 'class-validator';

export type KitchenOrderStatus = 'pendiente' | 'preparacion' | 'servido';

export class UpdateKitchenOrderStatusDto {
  @IsIn(['pendiente', 'preparacion', 'servido'])
  status!: KitchenOrderStatus;
}
