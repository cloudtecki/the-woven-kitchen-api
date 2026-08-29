import { UserRole } from '../../domain/value-objects/user-role';

export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly role?: UserRole,
    public readonly isActive?: boolean
  ) {}
}
