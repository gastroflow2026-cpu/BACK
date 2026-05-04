import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

type ReservationRealtimeEvent =
  | 'reservation:created'
  | 'reservation:updated'
  | 'reservation:cancelled';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  roles?: string[];
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
})
@Injectable()
export class ReservationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token = (client.handshake.auth as { token?: string })?.token;

      if (!token) {
        client.userId = 'guest';
        client.restaurantId = undefined;
        client.roles = ['GUEST'];
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as {
        id: string;
        restaurant_id?: string;
        roles?: string[];
      };

      client.userId = decoded.id;
      client.restaurantId = decoded.restaurant_id;
      client.roles = decoded.roles || [];

      if (client.restaurantId) {
        client.join(`restaurant-${client.restaurantId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {
    return;
  }

  emitToRestaurant(
    restaurantId: string,
    event: ReservationRealtimeEvent,
    payload: unknown,
  ) {
    this.server.to(`restaurant-${restaurantId}`).emit(event, payload);
  }
}
