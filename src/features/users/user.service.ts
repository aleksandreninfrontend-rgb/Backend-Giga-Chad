import {
  BadRequestException,
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
import { SessionsService } from '../../auth/sessions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginatedActiveUsersResponseDto } from './dto/active-users-response.dto.js';
import { GetActiveUsersQueryDto } from './dto/get-active-users-query.dto.js';
import { RedisService } from '../../providers/cache/redis.service.js';

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? '30');
const USERS_ALL_VERSION_KEY = 'users:all:version';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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
    await this.redis.incr(USERS_ALL_VERSION_KEY);
    return this.toResponse(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const cacheKey = `users:me:${id}`;
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser) as UserResponseDto;
    }
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const response = this.toResponse(user);
    await this.redis.set(cacheKey, JSON.stringify(response), CACHE_TTL_SECONDS);
    return response;
  }

  findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  findActiveById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginatedUserResponseDto> {
    const version = (await this.redis.get(USERS_ALL_VERSION_KEY)) ?? '0';
    const cacheKey = `users:all:version=${version}:page=${query.page}:limit=${query.limit}:login=${query.login ?? ''}`;

    const cachedUsers = await this.redis.get(cacheKey);
    if (cachedUsers) {
      return JSON.parse(cachedUsers) as PaginatedUserResponseDto;
    }
    const { users, total, page, limit } =
      await this.userRepository.findAll(query);
    const totalPages = Math.ceil(total / limit);
    const usersResponse = users.map((user) => this.toResponse(user));
    const response = {
      users: usersResponse,
      meta: { total, page, limit, totalPages },
    };
    await this.redis.set(cacheKey, JSON.stringify(response), CACHE_TTL_SECONDS);
    return response;
  }

  async findActive(
    query: GetActiveUsersQueryDto,
  ): Promise<PaginatedActiveUsersResponseDto> {
    if (query.minAge > query.maxAge) {
      throw new BadRequestException('Min age cannot be greater than max age');
    }
    const { rows, total, page, limit } = await this.userRepository.findActive(
      query.minAge,
      query.maxAge,
      query.page,
      query.limit,
    );
    const totalPages = Math.ceil(total / limit);
    return {
      users: rows.map((row) => ({
        user: {
          id: row.id,
          email: row.email,
          login: row.login,
          age: row.age,
          role: row.role,
          description: row.description,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deletedAt: row.deletedAt,
        },
        latestAvatar: {
          id: row.avatarId,
          userId: row.avatarUserId,
          path: row.avatarPath,
          createdAt: row.avatarCreatedAt,
        },
      })),
      meta: { total, page, limit, totalPages },
    };
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
    const response = this.toResponse(updatedUser);
    await this.redis.set(
      `users:me:${id}`,
      JSON.stringify(response),
      CACHE_TTL_SECONDS,
    );
    await this.redis.incr(USERS_ALL_VERSION_KEY);
    return response;
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
    await this.prisma.$transaction(async (tx) => {
      await this.sessionsService.revokeAll(id, tx);
      await this.userRepository.softDeleteById(id, tx);
    });
    await this.redis.del(`users:me:${id}`);
    await this.redis.incr(USERS_ALL_VERSION_KEY);
  }

  toResponse(user: User): UserResponseDto {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
