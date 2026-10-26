import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, type User } from '@prisma/client';
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
import { TransferDto } from './dto/transfer.dto.js';
import { ConfigService } from '@nestjs/config';
import { InsufficientFundsException } from './exceptions/insufficient-funds.exception.js';

const USERS_ALL_VERSION_KEY = 'users:all:version';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly cacheTtlSeconds: number;
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.cacheTtlSeconds = Number(config.get('CACHE_TTL_SECONDS', '30'));
  }

  private meVersionKey(userId: string): string {
    return `users:me:${userId}:version`;
  }

  private meCacheKey(userId: string, version: string): string {
    return `users:me:${userId}:version=${version}`;
  }

  private async invalidateMeCache(userId: string): Promise<void> {
    await this.redis.incr(this.meVersionKey(userId));
  }

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
    const version = (await this.redis.get(this.meVersionKey(id))) ?? '0';
    const cacheKey = this.meCacheKey(id, version);
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser) as UserResponseDto;
    }
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const response = this.toResponse(user);
    const versionAfter = (await this.redis.get(this.meVersionKey(id))) ?? '0';
    if (versionAfter === version) {
      await this.redis.set(
        cacheKey,
        JSON.stringify(response),
        this.cacheTtlSeconds,
      );
    }
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
    await this.redis.set(
      cacheKey,
      JSON.stringify(response),
      this.cacheTtlSeconds,
    );
    return response;
  }

  async findActive(
    query: GetActiveUsersQueryDto,
  ): Promise<PaginatedActiveUsersResponseDto> {
    const { rows, total, page, limit } = await this.userRepository.findActive(
      query.minAge,
      query.maxAge,
      query.page,
      query.limit,
    );
    const totalPages = Math.ceil(total / limit);
    return {
      users: rows.map((row) => ({
        user: this.toResponse({
          id: row.id,
          email: row.email,
          login: row.login,
          age: row.age,
          role: row.role,
          description: row.description,
          balance: row.balance,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deletedAt: row.deletedAt,
        }),
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
    await this.invalidateMeCache(id);
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
    await this.invalidateMeCache(id);
    await this.redis.incr(USERS_ALL_VERSION_KEY);
    this.logger.log({
      msg: 'User soft-deleted',
      userId: id,
      actorId: options?.actorId,
    });
  }

  async transfer(fromId: string, dto: TransferDto): Promise<UserResponseDto> {
    if (fromId === dto.recipientId) {
      this.logger.warn({
        msg: 'Transfer failed',
        reason: 'self_transfer',
        fromId,
        recipientId: dto.recipientId,
        amount: dto.amount,
      });
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lessThanOrEqualTo(0)) {
      this.logger.warn({
        msg: 'Transfer failed',
        reason: 'invalid_amount',
        fromId,
        recipientId: dto.recipientId,
        amount: dto.amount,
      });
      throw new BadRequestException('Amount must be greater than 0');
    }

    const fromUser = await this.prisma.$transaction(async (tx) => {
      const result = await this.userRepository.transfer(
        fromId,
        dto.recipientId,
        amount,
        tx,
      );

      if (result.status === 'user_not_found') {
        this.logger.warn({
          msg: 'Transfer failed',
          reason: 'user_not_found',
          fromId,
          recipientId: dto.recipientId,
          amount: amount.toString(),
        });
        throw new NotFoundException('User not found');
      }
      if (result.status === 'insufficient_funds') {
        this.logger.warn({
          msg: 'Transfer failed',
          reason: 'insufficient_funds',
          fromId,
          recipientId: dto.recipientId,
          amount: amount.toString(),
        });
        throw new InsufficientFundsException();
      }

      return result.fromUser;
    });

    await this.invalidateMeCache(fromId);
    await this.invalidateMeCache(dto.recipientId);
    await this.redis.incr(USERS_ALL_VERSION_KEY);
    this.logger.log({
      msg: 'Transfer completed',
      fromId,
      recipientId: dto.recipientId,
      amount: amount.toString(),
    });

    return this.toResponse(fromUser);
  }

  toResponse(user: Omit<User, 'password'> | User): UserResponseDto {
    const { password: _password, balance, ...rest } = user as User;
    return {
      ...rest,
      balance: balance.toFixed(2),
    };
  }
}
