import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
