// chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';
import { UsersModule } from '../users/users.module'; // ajusta el path

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    JwtModule,         // usa la config global
    UsersModule,
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}