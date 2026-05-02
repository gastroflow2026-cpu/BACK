// chat/chat.gateway.ts
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
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Mapa para saber qué socket pertenece a qué usuario
  private connectedUsers = new Map<string, string>(); // userId → socketId

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.chatService.getUserFromSocket(client);
      if (!user) {
        client.disconnect();
        return;
      }
      this.connectedUsers.set(user.id, client.id);
      client.data.user = user;
    } catch (error){
      console.log(error);
      
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.id);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    const sender = client.data.user;

    // Guardar en DB
    const message = await this.chatService.saveMessage({
      senderId: sender.id,
      receiverId: payload.receiverId,
      content: payload.content,
    });

    // Emitir al receptor si está conectado
    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('new_message', message);
    }

    // Confirmar al sender
    client.emit('message_sent', message);

    return message;
  }

  @SubscribeMessage('get_history')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { withUserId: string },
  ) {
    const user = client.data.user;
    const messages = await this.chatService.getHistory(user.id, payload.withUserId);
    client.emit('chat_history', messages);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string },
  ) {
    const user = client.data.user;
    await this.chatService.markAsRead(payload.senderId, user.id);
    client.emit('messages_read', { senderId: payload.senderId });
  }
}