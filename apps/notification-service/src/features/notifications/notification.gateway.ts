import { Inject, Logger } from '@nestjs/common';
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
import { JwtService } from '@nestjs/jwt';
import { ACCESS_JWT, type JwtPayload } from '@app/common';
import type {
  AppServer,
  AppSocket,
  TransferNotification,
  WelcomePayload,
} from './types/socket.types.js';

@WebSocketGateway({
  cors: { origin: '*' },
  maxHttpBufferSize: 1e6,
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private static readonly MAX_BUFFERED_BYTES = 1 * 1024 * 1024;

  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: AppServer;

  constructor(
    @Inject(ACCESS_JWT) private readonly accessJwtService: JwtService,
  ) {}

  async handleConnection(client: AppSocket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn({
        msg: 'Socket rejected: missing token',
        socketId: client.id,
      });
      client.disconnect(true);
      return;
    }

    let payload: JwtPayload;
    try {
      payload = await this.accessJwtService.verifyAsync<JwtPayload>(token);
    } catch (err) {
      this.logger.warn({
        msg: 'Socket rejected: invalid token',
        socketId: client.id,
        reason: err instanceof Error ? err.message : 'verify failed',
      });
      client.disconnect(true);
      return;
    }

    const userId = payload.sub;
    client.data.userId = userId;
    client.data.connectedAt = new Date().toISOString();

    await client.join(`user:${userId}`);

    const welcome: WelcomePayload = {
      message: 'Connected to notification-service',
      socketId: client.id,
    };
    client.emit('welcome', welcome);

    this.logger.log({
      msg: 'Socket connected',
      socketId: client.id,
      userId,
      room: `user:${userId}`,
      connectedAt: client.data.connectedAt,
    });
  }

  sendNotification(userId: string, payload: TransferNotification): void {
    const room = `user:${userId}`;
    this.disconnectSlowClientsInRoom(room, userId);
    this.server.to(room).emit('notification', payload);
    this.logger.log({
      msg: 'Notification sent',
      userId,
      room,
      eventId: payload.eventId,
    });
  }

  handleDisconnect(client: AppSocket): void {
    this.logger.log({
      msg: 'Socket disconnected',
      socketId: client.id,
      userId: client.data.userId,
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
      userId: client.data.userId,
      ts: body.ts,
    });
    return { event: 'pong', data: { ts: body.ts } };
  }

  private getBufferedAmount(client: AppSocket): number {
    const buffered = (
      client.conn as { transport?: { socket?: { bufferedAmount?: number } } }
    )?.transport?.socket?.bufferedAmount;
    return typeof buffered === 'number' ? buffered : 0;
  }

  private disconnectSlowClientsInRoom(room: string, userId: string): void {
    for (const socket of this.server.sockets.sockets.values()) {
      if (!socket.rooms.has(room)) continue;

      const bufferedAmount = this.getBufferedAmount(socket as AppSocket);
      if (bufferedAmount <= NotificationGateway.MAX_BUFFERED_BYTES) continue;

      this.logger.warn({
        msg: 'Disconnecting slow client',
        socketId: socket.id,
        userId,
        bufferedAmount,
        maxBufferedBytes: NotificationGateway.MAX_BUFFERED_BYTES,
      });
      socket.disconnect(true);
    }
  }

  private extractToken(client: AppSocket): string | undefined {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth;
    }

    // Postman fallback (no handshake.auth support) — remove after testing
    const headerToken = client.handshake.headers?.token;
    if (typeof headerToken === 'string' && headerToken.length > 0) {
      return headerToken;
    }

    const authorization = client.handshake.headers?.authorization;
    if (typeof authorization === 'string') {
      const [type, token] = authorization.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return undefined;
  }
}
