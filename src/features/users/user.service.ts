import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserRepository } from './users.repository.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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

  private toResponse(user: User): UserResponseDto {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
