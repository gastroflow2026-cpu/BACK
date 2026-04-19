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
import { AuthProvider, UserRole } from '../../common/user.enums';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity({
  name: 'USERS',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  restaurant_id!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.users)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  first_name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  last_name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 70,
    nullable: true,
  })
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL_AUTH,
  })
  auth_provider!: AuthProvider;

  @Column({
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  imgUrl!: string;

 @Column({
  type: 'varchar',
  length: 50,
  nullable: true,
})
  city!: string;

  @Column({
  type: 'varchar',
  length: 50,
  nullable: true,
})
  country!: string; 

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}