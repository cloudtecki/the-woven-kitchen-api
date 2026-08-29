import { injectable, inject } from 'inversify';
import { DeleteUserCommand } from '../commands/delete-user.command';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { TYPES } from '../../shared/constants/tokens';
import { NotFoundError } from '../../shared/errors';

@injectable()
export class DeleteUserHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const deleted = await this.userRepository.delete(command.id);
    if (!deleted) {
      throw new NotFoundError('User');
    }
  }
}
