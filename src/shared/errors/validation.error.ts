import { AppError } from './app-error.base';

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
  readonly code = 'VALIDATION_ERROR';
  readonly errors: Record<string, string | string[]>;

  constructor(message: string, errors: Record<string, string | string[]> = {}) {
    super(message);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}
