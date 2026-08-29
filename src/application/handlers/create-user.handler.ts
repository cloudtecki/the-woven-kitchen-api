import { injectable, inject } from 'inversify';
import { CreateUserCommand } from '../commands/create-user.command';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role';
import { TYPES } from '../../shared/constants/tokens';
import { ConflictError } from '../../shared/errors';

@injectable()
export class CreateUserHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    return this.userRepository.create({
      email: command.email,
      name: command.name,
      role: command.role || UserRole.STAFF,
      isActive: true,
    });
  }
}
