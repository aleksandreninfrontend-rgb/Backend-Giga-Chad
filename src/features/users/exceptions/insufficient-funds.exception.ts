import { BadRequestException } from '@nestjs/common';

export class InsufficientFundsException extends BadRequestException {
  constructor(message = 'Insufficient funds') {
    super(message);
  }
}
