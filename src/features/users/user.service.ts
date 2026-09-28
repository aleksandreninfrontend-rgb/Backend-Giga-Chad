import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersRepository } from './users.repository.js';
import { GetUsersQueryDto } from './dto/get-users-query.dto.js';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Email already taken');
    }

    const existingByLogin = await this.userRepository.findByLogin(dto.login);
    if (existingByLogin) {
      throw new ConflictException('Login already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
      age: dto.age,
      description: dto.description,
    });

    return this.toResponse(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user);
  }

  findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  private toResponse(user: User): UserResponseDto {
    const { password: _password, ...rest } = user;
    return rest;
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginatedUserResponseDto> {
    const { users, total, page, limit } =
      await this.userRepository.findAll(query);
    const totalPages = Math.ceil(total / limit);
    const usersResponse = users.map((user) => this.toResponse(user));
    return { users: usersResponse, meta: { total, page, limit, totalPages } };
  }
}
