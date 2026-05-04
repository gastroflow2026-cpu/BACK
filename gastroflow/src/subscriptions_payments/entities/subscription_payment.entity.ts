import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { SubscriptionPaymentStatus } from '../../common/subscription_payment.enum';

@Entity({ name: 'SUBSCRIPTION_PAYMENTS' })
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Subscription, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', default: 'usd' })
  currency!: string;

  @Column({ type: 'varchar', default: 'stripe' })
  provider!: string;

  @Column({ type: 'varchar', nullable: true })
  transaction_id?: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_session_id?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentStatus,
    default: SubscriptionPaymentStatus.PENDING,
  })
  status!: SubscriptionPaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paid_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
