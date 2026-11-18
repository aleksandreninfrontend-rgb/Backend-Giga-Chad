import { Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_JWT, resolveRequestId, type JwtPayload } from '@app/common';
import { ClsService, UseCls } from 'nestjs-cls';
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
    private readonly cls: ClsService,
  ) {}

  @UseCls<[AppSocket]>({
    generateId: true,
    idGenerator: function (client) {
      return NotificationGateway.requestIdFromHandshake(client);
    },
  })
  async handleConnection(client: AppSocket): Promise<void> {
    client.data.requestId = this.cls.getId();
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
      requestId: payload.requestId,
    });
  }

  @UseCls<[AppSocket]>({
    generateId: true,
    idGenerator: function (client) {
      return resolveRequestId(client.data?.requestId);
    },
  })
  async handleDisconnect(client: AppSocket): Promise<void> {
    this.logger.log({
      msg: 'Socket disconnected',
      socketId: client.id,
      userId: client.data.userId,
      connectedAt: client.data.connectedAt,
    });
  }

  private getBufferedAmount(client: AppSocket): number {
    const buffered = (
      client.conn as { transport?: { socket?: { bufferedAmount?: number } } }
    )?.transport?.socket?.bufferedAmount;
    return typeof buffered === 'number' ? buffered : 0;
  }

  private disconnectSlowClientsInRoom(room: string, userId: string): void {
    const socketIds = this.server.sockets.adapter.rooms.get(room);
    if (!socketIds) {
      return;
    }

    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (!socket) {
        continue;
      }

      const bufferedAmount = this.getBufferedAmount(socket as AppSocket);
      if (bufferedAmount <= NotificationGateway.MAX_BUFFERED_BYTES) {
        continue;
      }

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
    const fromAuth: unknown = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth;
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

  private static requestIdFromHandshake(client: AppSocket): string {
    const incoming = client.handshake.headers?.['x-request-id'];
    const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
    return resolveRequestId(fromHeader);
  }
}
