import type { Server, Socket } from 'socket.io';
import type { TransferCompletedEvent } from '@app/common';

export type TransferNotification = TransferCompletedEvent;

export type SocketData = {
  connectedAt: string;
  userId: string;
  requestId: string;
};

export type ServerToClientEvents = {
  welcome: (payload: WelcomePayload) => void;
  notification: (payload: TransferNotification) => void;
};

export type ClientToServerEvents = Record<string, never>;

export type WelcomePayload = {
  message: string;
  socketId: string;
};

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
