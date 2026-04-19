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
import { MenuCategory } from './menu-category.entity';
import { MenuItemStatus } from '../../common/menu.enum';

@Entity({ name: 'MENU_ITEMS' })
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  restaurant_id!: string;

  @Column({ type: 'uuid', nullable: false })
  category_id!: string;

  @ManyToOne(() => MenuCategory, (category) => category.menu_items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category!: MenuCategory;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  image_url?: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_available!: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  allergens!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  tags!: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  prep_time_minutes!: number;

  @Column({
    type: 'enum',
    enum: MenuItemStatus,
    default: MenuItemStatus.AVAILABLE,
  })
  status!: MenuItemStatus;

  @Column({
    type: 'int',
    default: 0,
  })
  display_order!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}
