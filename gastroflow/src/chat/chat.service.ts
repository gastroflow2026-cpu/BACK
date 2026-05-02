// chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatMessage } from './entities/chat-message.entity';
import { UsersService } from '../users/users.service'; // ajusta el path
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // Extrae el usuario del token JWT del socket
  async getUserFromSocket(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');
        console.log('Token extraído:', token)
    if (!token) return null;

    try {

      const secret = this.configService.get<string>('JWT_SECRET');  
      const payload = await this.jwtService.verifyAsync(token, {secret});
      console.log('Payload decodificado:', payload);
      const user = await this.usersService.getUserById(payload.sub);
      console.log('Usuario de DB:', user);
      return user;
      
    } catch (error) {
        console.log('❌ Error:', error.message);
      return null;
    }
  }

  async saveMessage(dto: { senderId: string; receiverId: string; content: string }) {
    const message = this.chatRepo.create({
      content: dto.content,
      sender: { id: dto.senderId },
      receiver: { id: dto.receiverId },
    });
    return await this.chatRepo.save(message);
  }

  async getHistory(userId: string, withUserId: string) {
    return await this.chatRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: withUserId } },
        { sender: { id: withUserId }, receiver: { id: userId } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });
  }

  async markAsRead(senderId: string, receiverId: string) {
    await this.chatRepo.update(
      { sender: { id: senderId }, receiver: { id: receiverId }, read: false },
      { read: true },
    );
  }
}