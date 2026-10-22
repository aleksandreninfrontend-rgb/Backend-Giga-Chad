import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GetUsersQueryDto } from './dto/get-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';
import { InsufficientFundsException } from './exceptions/insufficient-funds.exception.js';

export type ActiveUserWithLatestAvatarRow = {
  id: string;
  email: string;
  login: string;
  age: number;
  description: string;
  role: Role;
  balance: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  avatarId: string;
  avatarUserId: string;
  avatarPath: string;
  avatarCreatedAt: Date;
};

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
    const skip = (query.page - 1) * query.limit;
    const where = query.login
      ? { login: { contains: query.login, mode: Prisma.QueryMode.insensitive } }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        where: { ...where, deletedAt: null },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { users, total, page: query.page, limit: query.limit };
  }

  async findActive(
    minAge: number,
    maxAge: number,
    page: number,
    limit: number,
  ): Promise<{
    rows: ActiveUserWithLatestAvatarRow[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<ActiveUserWithLatestAvatarRow[]>(Prisma.sql`
        SELECT
          u.id,
          u.email,
          u.login,
          u.age,
          u.description,
          u.role,
          u.balance,
          u."createdAt",
          u."updatedAt",
          u."deletedAt",
          a.id AS "avatarId",
          a."userId" AS "avatarUserId",
          a.path AS "avatarPath",
          a."createdAt" AS "avatarCreatedAt"
        FROM "User" u
        INNER JOIN (
          SELECT "userId"
          FROM "Avatar"
          WHERE "deletedAt" IS NULL
          GROUP BY "userId"
          HAVING COUNT(*) > 2
        ) active_avatar_users ON active_avatar_users."userId" = u.id
        INNER JOIN LATERAL (
          SELECT id, "userId", path, "createdAt"
          FROM "Avatar"
          WHERE "userId" = u.id
            AND "deletedAt" IS NULL
          ORDER BY "createdAt" DESC, id DESC
          LIMIT 1
        ) a ON TRUE
        WHERE u."deletedAt" IS NULL
          AND u.age >= ${minAge}
          AND u.age <= ${maxAge}
          AND u.description IS NOT NULL
          AND BTRIM(u.description) <> ''
        ORDER BY u."createdAt" DESC, u.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "User" u
        INNER JOIN (
          SELECT "userId"
          FROM "Avatar"
          WHERE "deletedAt" IS NULL
          GROUP BY "userId"
          HAVING COUNT(*) > 2
        ) active_avatar_users ON active_avatar_users."userId" = u.id
        WHERE u."deletedAt" IS NULL
          AND u.age >= ${minAge}
          AND u.age <= ${maxAge}
          AND u.description IS NOT NULL
          AND BTRIM(u.description) <> ''
      `),
    ]);
    return {
      rows,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    };
  }

  updateById(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  softDeleteById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async transfer(
    fromId: string,
    toId: string,
    amount: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ): Promise<{ fromUser: User; toUser: User }> {
    const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "User"
      WHERE id IN (${Prisma.join([fromId, toId])}) AND "deletedAt" IS NULL
      ORDER BY id
      FOR UPDATE
    `);
    if (locked.length !== 2) {
      throw new NotFoundException('User not found');
    }

    const debit = await tx.user.updateMany({
      where: {
        id: fromId,
        deletedAt: null,
        balance: { gte: amount },
      },
      data: { balance: { decrement: amount } },
    });

    if (debit.count === 0) {
      throw new InsufficientFundsException();
    }

    const toUser = await tx.user.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    const fromUser = await tx.user.findFirstOrThrow({
      where: { id: fromId },
    });

    return { fromUser, toUser };
  }
}
