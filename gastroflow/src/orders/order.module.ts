import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order_item";
import { RestaurantTables } from "../restaurant_tables/entities/restaurant_table.entity";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { User } from "../users/entities/user.entity";
import { MenuItem } from "../menu/entities/menu-item.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, RestaurantTables, User, MenuItem])],
    controllers: [OrderController],
    providers: [OrderService]
})

export class OrderModule{}