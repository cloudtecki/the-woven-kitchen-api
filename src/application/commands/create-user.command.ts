import { UserRole } from '../../domain/value-objects/user-role';

export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly role?: UserRole
  ) {}
}
