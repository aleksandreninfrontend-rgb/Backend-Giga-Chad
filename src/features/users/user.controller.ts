import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/types/jwt-payload.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../auth/guards/roles-guard.js';
import { GetUsersQueryDto } from './dto/get-users-query.dto.js';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllUsers(
    @Query() query: GetUsersQueryDto,
  ): Promise<PaginatedUserResponseDto> {
    return this.userService.findAll(query);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.userService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(AccessTokenGuard)
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateById(user.sub, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateById(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateById(id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  softDeleteMe(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.userService.softDeleteById(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.ADMIN)
  softDeleteById(@CurrentUser() admin: JwtPayload, @Param('id') id: string) {
    return this.userService.softDeleteById(id, { actorId: admin.sub });
  }
}
