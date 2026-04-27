import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order_item";

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem])],
    controllers: [],
    providers: []
})

export class OrderModule{}