import { IsEnum } from 'class-validator';
import { KitchenOrderStatus } from '../../common/order.enum';

export class UpdateKitchenOrderStatusDto {
  @IsEnum(KitchenOrderStatus)
  status!: KitchenOrderStatus;
}
