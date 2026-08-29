import { AppError } from './app-error.base';

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;
  readonly code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
