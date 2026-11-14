import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { WsResponse } from '@nestjs/websockets';
import type {
  AppServer,
  AppSocket,
  WelcomePayload,
} from './types/socket.types.js';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: AppServer;

  handleConnection(client: AppSocket): void {
    client.data.connectedAt = new Date().toISOString();

    const payload: WelcomePayload = {
      message: 'Connected to notification-service',
      socketId: client.id,
    };

    client.emit('welcome', payload);

    this.logger.log({
      msg: 'Socket connected',
      socketId: client.id,
      connectedAt: client.data.connectedAt,
    });
  }

  handleDisconnect(client: AppSocket): void {
    this.logger.log({
      msg: 'Socket disconnected',
      socketId: client.id,
      connectedAt: client.data.connectedAt,
    });
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: { ts: number },
  ): WsResponse<{ ts: number }> {
    this.logger.log({
      msg: 'ping received',
      socketId: client.id,
      ts: body.ts,
    });

    return { event: 'pong', data: { ts: body.ts } };
  }
}
