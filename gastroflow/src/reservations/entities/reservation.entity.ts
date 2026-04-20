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
import { RestaurantTables } from '../../restaurant_tables/entities/restaurant_table.entity';
import { User } from '../../users/entities/user.entity';
import { ReservationStatus } from '../../common/reservation.enum';

@Entity({
  name: 'RESERVATIONS',
})
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reservations)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @ManyToOne(() => RestaurantTables, (table) => table.reservations)
  @JoinColumn({ name: 'table_id' })
  table!: RestaurantTables;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  customer_name!: string;

    @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  customer_email!: string;

  @Column({
    type: 'int',
    nullable: false,
    default: 0
  })
  customer_phone!: number;

  @Column({
    type: 'timestamp'
  })
  reservation_date!:Date;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({
    type: 'int',
    nullable: false,
  })
  guests_count!:number

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: string;

  
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  notes!: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  deposit_amount!: number;


  @Column({
    default: true,
  })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}