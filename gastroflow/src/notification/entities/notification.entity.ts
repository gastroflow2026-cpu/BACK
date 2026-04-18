import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  // ManyToOne,
  //JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

//import { Restaurant } from '../../restaurant/entities/restaurant.entity';
//import { User } from '../../users/entities/user.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /*RELACIÓN CON RESTAURANTE
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.notification, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant; */

  /* RELACIÓN CON USUARIO
  @ManyToOne(() => User, (user) => user.notification, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;*/

  // TIPO DE NOTIFICACIÓN
  @Column({ type: 'varchar' })
  type!: string;
  // Ej: 'RESERVATION_REMINDER', 'SUBSCRIPTION_EXPIRING'

  // CANAL
  @Column({ type: 'varchar' })
  channel!: string;
  // Ej: 'EMAIL'

  // TÍTULO
  @Column({ type: 'varchar' })
  title!: string;

  // MENSAJE
  @Column({ type: 'text' })
  message!: string;

  // ESTADO
  @Column({ type: 'varchar', default: 'PENDING' })
  status!: string;
  // PENDING | SENT | FAILED

  // FECHA DE ENVÍO
  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date;

  // AUDITORÍA
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
