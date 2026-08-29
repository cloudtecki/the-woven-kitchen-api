import { AppError } from './app-error.base';

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;
  readonly code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
