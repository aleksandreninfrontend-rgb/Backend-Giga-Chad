import { Module } from '@nestjs/common';
import { RefreshTokenRepository } from './refresh-token.repository.js';

@Module({
  providers: [RefreshTokenRepository],
  exports: [RefreshTokenRepository],
})
export class TokenModule {}
