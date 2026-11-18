import type { Role } from './role.enum.js';

export type JwtPayload = {
  sub: string;
  login?: string;
  role: Role;
};
