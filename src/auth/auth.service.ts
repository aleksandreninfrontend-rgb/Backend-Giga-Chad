import { createHash } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../features/users/user.service.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/auth-response-dto.js';
import * as bcrypt from 'bcrypt';
import { ACCESS_JWT, REFRESH_JWT, REFRESH_TOKEN_TTL_MS } from './constants.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    @Inject(ACCESS_JWT) private readonly accessJwtService: JwtService,
    @Inject(REFRESH_JWT) private readonly refreshJwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async signIn(login: string, pass: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findByLogin(login);
    if (!user) {
      throw new UnauthorizedException();
    }
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
      throw new UnauthorizedException();
    }
    const tokens = await this.issueTokens(user);
    return {
      user: this.usersService.toResponse(user),
      ...tokens,
    };
  }

  async register(user: CreateUserDto): Promise<AuthResponseDto> {
    const created_user = await this.usersService.create(user);
    const tokens = await this.issueTokens(created_user);

    return {
      user: created_user,
      ...tokens,
    };
  }
  private async issueTokens(user: { id: string; login: string; role: Role }) {
    const payload = { sub: user.id, login: user.login, role: user.role };
    const [access_token, refresh_token] = await Promise.all([
      this.accessJwtService.signAsync(payload),
      this.refreshJwtService.signAsync({ sub: user.id }),
    ]);
    const refresh_token_hash = this.hashToken(refresh_token);
    await this.refreshTokenRepository.create({
      tokenHash: refresh_token_hash,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    return { access_token, refresh_token };
  }

  async refresh(refresh_token: string): Promise<AuthResponseDto> {
    try {
      await this.refreshJwtService.verifyAsync(refresh_token);
    } catch {
      throw new UnauthorizedException();
    }

    const oldRefreshTokenHash = this.hashToken(refresh_token);
    const existingRefreshToken =
      await this.refreshTokenRepository.findValidByHash(oldRefreshTokenHash);
    if (!existingRefreshToken) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.findActiveById(
      existingRefreshToken.userId,
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, login: user.login, role: user.role };
    const [access_token, new_refresh_token] = await Promise.all([
      this.accessJwtService.signAsync(payload),
      this.refreshJwtService.signAsync({ sub: user.id }),
    ]);
    const newRefreshTokenHash = this.hashToken(new_refresh_token);
    try {
      await this.refreshTokenRepository.rotate(oldRefreshTokenHash, {
        tokenHash: newRefreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });
    } catch {
      throw new UnauthorizedException();
    }
    return {
      user: this.usersService.toResponse(user),
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
