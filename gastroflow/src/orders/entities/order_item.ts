import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { MenuItem } from "../../menu/entities/menu-item.entity";
import { OrderItemStatus } from "../../common/order.enum";

@Entity({ name: 'ORDER_ITEMS' })
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order!: Order;

    @ManyToOne(() => MenuItem)
    @JoinColumn({ name: 'menu_item_id' })
    menuItem!: MenuItem;

    @Column({ type: 'int' })
    quantity!: number;

    @Column({ type: 'decimal' })
    unit_price!: number;

    @Column({ type: 'text', nullable: true })
    notes!: string; // ej: "sin cebolla"

    @Column({ type: 'enum', enum: OrderItemStatus, default: OrderItemStatus.PENDING })
    status!: OrderItemStatus; // para el chef
}