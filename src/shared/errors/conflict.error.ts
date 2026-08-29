import { AppError } from './app-error.base';

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
