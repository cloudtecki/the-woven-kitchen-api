import { injectable, inject } from 'inversify';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { TYPES } from '../../shared/constants/tokens';
import { NotFoundError } from '../../shared/errors';

@injectable()
export class GetUserByIdHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.userRepository.findById(query.id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }
}
