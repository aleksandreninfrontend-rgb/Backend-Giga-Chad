import { UserResponseDto } from '../../features/users/dto/user-response.dto.js';

export class AuthResponseDto {
  user: UserResponseDto;
  access_token: string;
  refresh_token: string;
}
