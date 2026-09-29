import {
  ConflictException,
  ForbiddenException,
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
import { UpdateUserDto } from './dto/update-user-dto.js';
import { RefreshTokenRepository } from '../../auth/refresh-token.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Email already taken');
    }

    const existingByLogin = await this.userRepository.findByLoginAny(dto.login);
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

  async findAll(query: GetUsersQueryDto): Promise<PaginatedUserResponseDto> {
    const { users, total, page, limit } =
      await this.userRepository.findAll(query);
    const totalPages = Math.ceil(total / limit);
    const usersResponse = users.map((user) => this.toResponse(user));
    return { users: usersResponse, meta: { total, page, limit, totalPages } };
  }

  async updateById(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const existingByEmail = await this.userRepository.findByEmail(dto.email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Email already taken');
      }
    }

    if (dto.login) {
      const existingByLogin = await this.userRepository.findByLoginAny(
        dto.login,
      );
      if (existingByLogin && existingByLogin.id !== id) {
        throw new ConflictException('Login already taken');
      }
    }

    const updatedUser = await this.userRepository.updateById(id, dto);
    return this.toResponse(updatedUser);
  }

  async softDeleteById(
    id: string,
    options?: { actorId: string },
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (options?.actorId === id) {
      throw new ForbiddenException('Admins cannot delete themselves');
    }
    await this.refreshTokenRepository.revokeByUserId(id);
    await this.userRepository.softDeleteById(id);
  }

  private toResponse(user: User): UserResponseDto {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
