import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';

@Module({
  providers: [SessionsService, RefreshTokenRepository],
  exports: [SessionsService],
})
export class SessionsModule {}
