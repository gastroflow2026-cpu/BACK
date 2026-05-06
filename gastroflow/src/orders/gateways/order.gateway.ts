import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getAllowedCorsOrigins } from '../../config/cors-origins';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  roles?: string[];
}

@WebSocketGateway({
  cors: {
    origin: getAllowedCorsOrigins(),
    credentials: true,
  },
})
@Injectable()
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token = (client.handshake.auth as { token?: string })?.token;

      if (!token) {
        console.log('[WS] Cliente invitado conectado');
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

      const restaurantRoom = `restaurant-${client.restaurantId}`;
      client.join(restaurantRoom);

      console.log(
        `[WS] Conectado: ${client.userId} | Restaurante: ${client.restaurantId} | Roles: ${(client.roles || []).join(', ')}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message === 'jwt expired' || message === 'invalid token') {
        console.log(
          '[WS] Token inválido/vencido. Cliente conectado como invitado',
        );
        client.userId = 'guest';
        client.restaurantId = undefined;
        client.roles = ['GUEST'];
        return;
      }

      console.error('[WS] Error en conexión:', message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[WS] Desconectado: ${client.userId}`);
  }

  emitToRestaurant(restaurantId: string, event: string, payload: any) {
    const room = `restaurant-${restaurantId}`;
    this.server.to(room).emit(event, payload);
  }
}
