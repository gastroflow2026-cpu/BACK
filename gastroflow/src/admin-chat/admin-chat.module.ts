import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminChatGateway } from './admin-chat.gateway';
import { AdminChatService } from './admin-chat.service';
import { AdminChatMessage } from './entities/admin-chat-message.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminChatMessage]),
    JwtModule,
    UsersModule,
  ],
  providers: [AdminChatGateway, AdminChatService],
})
export class AdminChatModule {}