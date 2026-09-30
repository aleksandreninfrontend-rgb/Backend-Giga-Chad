import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RefreshTokenRepository } from './refresh-token.repository.js';

@Injectable()
export class SessionsService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  create(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.refreshTokenRepository.create(data);
  }

  findValidByHash(hash: string) {
    return this.refreshTokenRepository.findValidByHash(hash);
  }

  rotate(oldTokenHash: string, data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.refreshTokenRepository.rotate(oldTokenHash, data);
  }

  revokeAll(userId: string, tx?: Prisma.TransactionClient) {
    return this.refreshTokenRepository.revokeByUserId(userId, tx);
  }
}
