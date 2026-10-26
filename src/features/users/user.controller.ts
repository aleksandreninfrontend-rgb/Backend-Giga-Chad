import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/types/jwt-payload.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { GetUsersQueryDto } from './dto/get-users-query.dto.js';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';
import { PaginatedActiveUsersResponseDto } from './dto/active-users-response.dto.js';
import { GetActiveUsersQueryDto } from './dto/get-active-users-query.dto.js';
import { TransferDto } from './dto/transfer.dto.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List users (admin). Supports pagination and login filter.',
  })
  @ApiOkResponse({ type: PaginatedUserResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  getAllUsers(
    @Query() query: GetUsersQueryDto,
  ): Promise<PaginatedUserResponseDto> {
    return this.userService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'User not found or soft-deleted' })
  getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.userService.findById(user.sub);
  }

  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'List active users by age range (admin). More than 2 active avatars, non-empty description, latest avatar. Supports pagination.',
  })
  @ApiOkResponse({ type: PaginatedActiveUsersResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  getActiveUsers(
    @Query() query: GetActiveUsersQueryDto,
  ): Promise<PaginatedActiveUsersResponseDto> {
    return this.userService.findActive(query);
  }

  @Post('me/transfer')
  @ApiOperation({
    summary:
      'Transfer USD from the current user balance to another user (race-safe)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  @ApiBadRequestResponse({
    description: 'Invalid amount, self-transfer, or insufficient funds',
  })
  @ApiNotFoundResponse({ description: 'Sender or recipient not found' })
  transfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TransferDto,
  ): Promise<UserResponseDto> {
    return this.userService.transfer(user.sub, dto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateById(user.sub, updateUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update any user by id (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  updateById(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateById(id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete current user' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse()
  softDeleteMe(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.userService.softDeleteById(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Soft-delete any user by id (admin). Admins cannot delete themselves.',
  })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  softDeleteById(@CurrentUser() admin: JwtPayload, @Param('id') id: string) {
    return this.userService.softDeleteById(id, { actorId: admin.sub });
  }
}
