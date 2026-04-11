import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entitiy';

@Entity({
  name: 'RESTAURANT_THEMES',
})
export class RestaurantTheme {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    nullable: false,
    unique: true,
  })
  restaurant_id!: string;

  @OneToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  primary_color!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  secondary_color!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  logo_url!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  font_family!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
