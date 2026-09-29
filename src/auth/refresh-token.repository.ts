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

  revoke(id: string) {
    return this.prisma.refreshToken.update({
      where: { id: id },
      data: { revokedAt: new Date() },
    });
  }

  revokeByUserId(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
