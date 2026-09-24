import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../features/users/user.service.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/auth-response-dto.js';
import * as bcrypt from 'bcrypt';
import { ACCESS_JWT, REFRESH_JWT } from './constants.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    @Inject(ACCESS_JWT) private readonly accessJwtService: JwtService,
    @Inject(REFRESH_JWT) private readonly refreshJwtService: JwtService,
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
    const { password, ...safeUser } = user;
    const tokens = await this.issueTokens(user);
    return {
      user: safeUser,
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
  private async issueTokens(user: { id: string; login: string }) {
    const payload = { sub: user.id, login: user.login };
    const [access_token, refresh_token] = await Promise.all([
      this.accessJwtService.signAsync(payload),
      this.refreshJwtService.signAsync({ sub: user.id }),
    ]);
    return { access_token, refresh_token };
  }
}
