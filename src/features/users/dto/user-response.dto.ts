import { Role } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  login: string;
  age: number;
  role: Role;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
