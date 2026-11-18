export type TransferCompletedEvent = {
  eventId: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  occurredAt: string;
};
