import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.prisma.refreshToken.create({ data });
  }

  findValidByHash(hash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash: hash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });
  }

  async rotate(
    oldTokenHash: string,
    data: Prisma.RefreshTokenUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.refreshToken.updateMany({
        where: {
          tokenHash: oldTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new Error('Failed to revoke old token');
      }
      await tx.refreshToken.create({ data });
      return result;
    });
  }

  revokeByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.refreshToken.updateMany({
      where: { userId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
