import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus, PaymentMethod } from '../../common/order.enum';
import { OrderItem } from './order_item';
import { RestaurantTables } from '../../restaurant_tables/entities/restaurant_table.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity({ name: 'ORDERS' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', nullable: true })
  display_id?: number;

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

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDIENTE })
  status!: OrderStatus;

  @Column({ type: 'decimal', default: 0 })
  total!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  served_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  paid_by?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  payment_method?: PaymentMethod;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
