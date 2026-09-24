import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../features/users/user.service.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { UserResponseDto } from '../features/users/dto/user-response.dto.js';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/auth-response-dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(login: string, pass: string): Promise<any> {
    const user = await this.usersService.findByLogin(login);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }

  async register(user: CreateUserDto): Promise<AuthResponseDto> {
    const created_user = await this.usersService.create(user);
    const access_token = await this.jwtService.signAsync({
      sub: created_user.id,
      login: created_user.login,
    });

    return {
      user: created_user,
      access_token,
    };
  }
}
