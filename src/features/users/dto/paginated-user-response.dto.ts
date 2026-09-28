import { UserResponseDto } from './user-response.dto.js';

export class PaginatedUserResponseDto {
  users: UserResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
