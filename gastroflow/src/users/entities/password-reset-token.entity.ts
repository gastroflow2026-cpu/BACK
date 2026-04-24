import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'PASSWORD_RESET_TOKENS' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column()
  token!: string;

  @Column()
  expires_at!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}