import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { PaymentStatus } from '../../common/reservations-payment.enum';

@Entity({ name: 'RESERVATIONS-PAYMENT' })
export class ReservationPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Reservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount!: number;

  @Column({ type: 'varchar', nullable: true })
  currency!: string;

  @Column({ type: 'varchar', nullable: true })
  provider!: string;

  @Column({ type: 'varchar', nullable: true })
  transaction_id!: string;

  @Column({ type: 'varchar', nullable: false })
  status!: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paid_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}   