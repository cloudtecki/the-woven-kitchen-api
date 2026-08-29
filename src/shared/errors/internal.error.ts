import { AppError } from './app-error.base';

export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;
  readonly code = 'INTERNAL_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}
