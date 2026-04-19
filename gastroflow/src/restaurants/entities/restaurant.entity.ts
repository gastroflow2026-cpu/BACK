import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  //OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
//import { RestaurantTheme } from '../../restaurant-theme/entities/restaurant-theme.entity';
import { Notification } from '../../notification/entities/notification.entity';
@Entity({
  name: 'RESTAURANTS',
})
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  //RELACION CON NOTIFICATION
  @OneToMany(() => Notification, (notification) => notification.restaurant)
  notifications!: Notification[];

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    unique: true,
  })
  slug!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  address!: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  city!: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  country!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  logo_url!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string;

  @Column({
    default: true,
  })
  is_active!: boolean;

  @OneToMany(() => User, (user) => user.restaurant)
  users!: User[];

  //@OneToOne(() => RestaurantTheme, (theme) => theme.restaurant)
  //theme!: RestaurantTheme;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
