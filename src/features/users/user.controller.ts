import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/types/jwt-payload.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../auth/guards/roles-guard.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllUsers(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.userService.findById(user.sub);
  }
}
