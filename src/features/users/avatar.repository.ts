import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AvatarRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AvatarCreateInput) {
    return this.prisma.avatar.create({ data });
  }

  countActiveByUserId(userId: string) {
    return this.prisma.avatar.count({ where: { userId, deletedAt: null } });
  }

  findAllByUserId(userId: string) {
    return this.prisma.avatar.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.avatar.findFirst({ where: { id, deletedAt: null } });
  }

  findByIdAndUserId(id: string, userId: string) {
    return this.prisma.avatar.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  softDeleteById(id: string) {
    return this.prisma.avatar.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findExpiredSoftDeleted(cutoff: Date) {
    return this.prisma.avatar.findMany({
      where: {
        deletedAt: { not: null, lt: cutoff },
      },
    });
  }

  hardDeleteById(id: string) {
    return this.prisma.avatar.delete({ where: { id } });
  }
}
