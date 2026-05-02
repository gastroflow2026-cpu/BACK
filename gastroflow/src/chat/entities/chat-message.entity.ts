// chat/entities/chat-message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // ajusta el path

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => User)
  sender!: User;

  @ManyToOne(() => User)
  receiver!: User;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}