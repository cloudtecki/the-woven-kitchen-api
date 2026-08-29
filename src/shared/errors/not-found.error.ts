import { AppError } from './app-error.base';

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;
  readonly code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
