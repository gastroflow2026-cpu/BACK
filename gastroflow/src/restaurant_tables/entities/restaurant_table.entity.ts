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
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { RestaurantTableStatus } from '../../common/restaurant_table.enum';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity({
  name: 'RESTAURANTS_TABLES',
})
export class RestaurantTables {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({
    type: 'int',
    nullable: false,
  })
  table_number!: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  capacity!: number;


  @Column({
    type: 'varchar',
    length: 25,
    nullable: false,
  })
  zone!: string;

  @Column({
    type: 'enum',
    enum: RestaurantTableStatus,
    default: RestaurantTableStatus.AVAILABLE,
  })
  status!: string;

  @Column({
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => Reservation, (reservation) => reservation.table)
  reservations!: Reservation[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}