import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { PlanType } from '../enums/plan-type.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Entity({ name: 'SUBSCRIPTIONS' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  plan_type!: PlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status!: SubscriptionStatus;

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date' })
  end_date!: Date;

  @Column({ type: 'date', nullable: true })
  next_payment_date?: Date;

  @Column({ type: 'boolean', default: true })
  auto_renew!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
