import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GetUsersQueryDto } from './dto/get-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByLogin(login: string) {
    return this.prisma.user.findFirst({ where: { login, deletedAt: null } });
  }

  findByLoginAny(login: string) {
    return this.prisma.user.findFirst({ where: { login } });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findAll(query: GetUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = query.login
      ? { login: { contains: query.login, mode: Prisma.QueryMode.insensitive } }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: { ...where, deletedAt: null },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { users, total, page, limit };
  }

  updateById(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  softDeleteById(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
