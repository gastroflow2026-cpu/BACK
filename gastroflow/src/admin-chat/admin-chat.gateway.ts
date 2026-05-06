import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AdminChatService } from './admin-chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/admin-chat',
})
export class AdminChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // userId → socketId

  constructor(private readonly adminChatService: AdminChatService) {}

  async handleConnection(client: Socket) {
    const user = await this.adminChatService.getUserFromSocket(client);
    if (!user) {
      client.disconnect();
      return;
    }
    this.connectedUsers.set(user.id, client.id);
    client.data.user = user;
    console.log(`[AdminChat] Conectado: ${user.email}`);
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.id);
      console.log(`[AdminChat] Desconectado: ${user.email}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    const sender = await this.adminChatService.getUserFromSocket(client);
    if (!sender) return;

    const message = await this.adminChatService.saveMessage({
      senderId: sender.id,
      receiverId: payload.receiverId,
      content: payload.content,
    });

    // Emitir al receptor si está conectado
    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('new_message', message);
    }

    client.emit('message_sent', message);
    return message;
  }

  @SubscribeMessage('get_history')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { withUserId: string },
  ) {
    const user = await this.adminChatService.getUserFromSocket(client);
    if (!user) return;

    const messages = await this.adminChatService.getHistory(
      user.id,
      payload.withUserId,
    );
    client.emit('chat_history', messages);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string },
  ) {
    const user = await this.adminChatService.getUserFromSocket(client);
    if (!user) return;

    await this.adminChatService.markAsRead(payload.senderId, user.id);
    client.emit('messages_read', { senderId: payload.senderId });
  }
}