import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AdminChatMessage } from './entities/admin-chat-message.entity';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminChatService {
  constructor(
    @InjectRepository(AdminChatMessage)
    private readonly chatRepo: Repository<AdminChatMessage>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async getUserFromSocket(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return null;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.usersService.getUserById(payload.id);  // Cambiar 'sub' a 'id'
    } catch {
      return null;
    }
  }

  async saveMessage(dto: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const message = this.chatRepo.create({
      content: dto.content,
      sender: { id: dto.senderId },
      receiver: { id: dto.receiverId },
    });
    const savedMessage = await this.chatRepo.save(message);
    const fullMessage = await this.findMessageById(savedMessage.id);
    return this.sanitizeMessageUsers(fullMessage ?? savedMessage);
  }

  async getHistory(userId: string, withUserId: string) {
    const messages = await this.chatRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: withUserId } },
        { sender: { id: withUserId }, receiver: { id: userId } },
      ],
      order: { createdAt: 'ASC' },
      relations: [
        'sender',
        'sender.restaurant',
        'receiver',
        'receiver.restaurant',
      ],
    });

    return messages.map((message) => this.sanitizeMessageUsers(message));
  }

  async markAsRead(senderId: string, receiverId: string) {
    await this.chatRepo.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
        read: false,
      },
      { read: true },
    );
  }

  private async findMessageById(id: string) {
    return this.chatRepo.findOne({
      where: { id },
      relations: [
        'sender',
        'sender.restaurant',
        'receiver',
        'receiver.restaurant',
      ],
    });
  }

  private sanitizeMessageUsers(message: AdminChatMessage) {
    const sender = message.sender as unknown as Record<string, unknown> | undefined;
    const receiver =
      message.receiver as unknown as Record<string, unknown> | undefined;

    const { password_hash: _senderPasswordHash, ...safeSender } = sender ?? {};
    const { password_hash: _receiverPasswordHash, ...safeReceiver } =
      receiver ?? {};

    return {
      ...message,
      sender: safeSender,
      receiver: safeReceiver,
    };
  }
}
