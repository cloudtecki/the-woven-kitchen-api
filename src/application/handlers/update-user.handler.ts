import { injectable, inject } from 'inversify';
import { UpdateUserCommand } from '../commands/update-user.command';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { TYPES } from '../../shared/constants/tokens';
import { NotFoundError } from '../../shared/errors';

@injectable()
export class UpdateUserHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const updated = await this.userRepository.update(command.id, {
      name: command.name,
      role: command.role,
      isActive: command.isActive,
    });

    if (!updated) {
      throw new NotFoundError('User');
    }

    return updated;
  }
}
