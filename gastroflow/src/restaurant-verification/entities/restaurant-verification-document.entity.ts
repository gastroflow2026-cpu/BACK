import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { RestaurantDocumentType } from '../../common/restaurant-document-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity({
  name: 'RESTAURANT_VERIFICATION_DOCUMENTS',
})
@Unique('UQ_restaurant_document_type', ['restaurant_id', 'document_type'])
export class RestaurantVerificationDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({
    type: 'enum',
    enum: RestaurantDocumentType,
    enumName: 'restaurant_document_type_enum',
  })
  document_type!: RestaurantDocumentType;

  @Column({
    type: 'varchar',
    length: 500,
  })
  file_url!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  file_public_id!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  original_name!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  mime_type!: string;

  @Column({
    type: 'int',
  })
  size!: number;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  uploaded_by_user_id!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploaded_by_user!: User | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
