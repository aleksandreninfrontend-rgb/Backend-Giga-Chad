export type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId?: string;
  timestamp: string;
  path?: string;
};
