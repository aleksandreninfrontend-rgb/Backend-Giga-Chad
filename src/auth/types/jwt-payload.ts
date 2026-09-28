import { Role } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  login?: string;
  role: Role;
};
