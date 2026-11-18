import type { Server, Socket } from 'socket.io';
import type { TransferCompletedEvent } from '@app/common';

export type TransferNotification = TransferCompletedEvent;

export type SocketData = {
  connectedAt: string;
  userId: string;
};

export type ServerToClientEvents = {
  welcome: (payload: WelcomePayload) => void;
  pong: (payload: { ts: number }) => void;
  notification: (payload: TransferNotification) => void;
};

export type ClientToServerEvents = {
  ping: (
    payload: { ts: number },
    ack?: (res: { ok: true; ts: number }) => void,
  ) => void;
};

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
