import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationLogType {
  SUBSCRIPTION_REMINDER = 'SUBSCRIPTION_REMINDER',
  RESTAURANT_APPROVED = 'RESTAURANT_APPROVED',
}

export enum NotificationLogStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notification_logs')
@Index(['type', 'target_id', 'scheduled_for'], { unique: true })
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationLogType,
  })
  type!: NotificationLogType;

  @Column({ type: 'uuid' })
  target_id!: string;

  @Column({ type: 'varchar', length: 255 })
  recipient_email!: string;

  @Column({ type: 'timestamp' })
  scheduled_for!: Date;

  @Column({
    type: 'enum',
    enum: NotificationLogStatus,
    default: NotificationLogStatus.PENDING,
  })
  status!: NotificationLogStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'int', default: 3 })
  max_attempts!: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  next_retry_at?: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
