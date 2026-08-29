import { injectable, inject } from 'inversify';
import { GetAllUsersQuery } from '../queries/get-all-users.query';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { TYPES } from '../../shared/constants/tokens';
import { FindAllResult } from '../../domain/repositories/user-repository.interface';

@injectable()
export class GetAllUsersHandler {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async execute(query: GetAllUsersQuery): Promise<FindAllResult & { page: number; limit: number; totalPages: number }> {
    const { data, total } = await this.userRepository.findAll(query.page, query.limit);
    const totalPages = Math.ceil(total / query.limit);
    return { data, total, page: query.page, limit: query.limit, totalPages };
  }
}
