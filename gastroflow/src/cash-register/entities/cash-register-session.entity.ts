import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { User } from '../../users/entities/user.entity';

export enum CashRegisterSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity({ name: 'CASH_REGISTER_SESSIONS' })
export class CashRegisterSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @ManyToOne(() => Restaurant, { nullable: false })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({ type: 'uuid' })
  cashier_user_id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'cashier_user_id' })
  cashier!: User;

  @Column({
    type: 'enum',
    enum: CashRegisterSessionStatus,
    default: CashRegisterSessionStatus.OPEN,
  })
  status!: CashRegisterSessionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  opening_amount!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  opened_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cash_sales_total!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  card_sales_total!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  transfer_sales_total!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  qr_sales_total!: number;

  @Column({ type: 'int', default: 0 })
  orders_paid_count!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expected_closing_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  declared_closing_amount!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference_amount!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  closing_notes!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
