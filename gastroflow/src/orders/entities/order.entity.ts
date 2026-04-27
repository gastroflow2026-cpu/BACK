import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Reservation } from "../../reservations/entities/reservation.entity";
import { User } from "../../users/entities/user.entity";
import { OrderStatus } from "../../common/order.enum";
import { UpdateDateColumn } from "typeorm/browser";
import { OrderItem } from "./order_item";
import { RestaurantTables } from "../../restaurant_tables/entities/restaurant_table.entity";
import { Restaurant } from "../../restaurants/entities/restaurant.entity";

@Entity({ name: 'ORDERS' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;


    @ManyToOne(() => Reservation, { nullable: true })
    @JoinColumn({ name: 'reservation_id' })
    reservation?: Reservation;

    @ManyToOne(() => User) 
    @JoinColumn({ name: 'waiter_id' })
    waiter!: User;

    @ManyToOne(() => RestaurantTables)
    @JoinColumn({ name: 'table_id' })
    table!: RestaurantTables;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items!: OrderItem[];

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
    status!: OrderStatus;

    @Column({ type: 'decimal', default: 0})
    total!: number;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @DeleteDateColumn()
    deleted_at!: Date;
}