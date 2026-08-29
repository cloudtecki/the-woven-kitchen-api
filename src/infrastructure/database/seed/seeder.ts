import { injectable, inject } from 'inversify';
import { UserModel } from '../models/user.model';
import { IUserRepository } from '../../../domain/repositories/user-repository.interface';
import { UserRole } from '../../../domain/value-objects/user-role';
import { TYPES } from '../../../shared/constants/tokens';
import { logger } from '../../../shared/utils/logger';

export interface SeedConfig {
  adminEmail: string;
  adminName: string;
  adminPassword?: string;
}

@injectable()
export class DatabaseSeeder {
  constructor(@inject(TYPES.UserRepository) private userRepository: IUserRepository) {}

  async run(config: SeedConfig): Promise<void> {
    await this.syncIndexes();
    await this.seedAdmin(config);
  }

  private async syncIndexes(): Promise<void> {
    try {
      await UserModel.init();
      await UserModel.syncIndexes();
      logger.info('MongoDB indexes synchronized');
    } catch (error) {
      logger.error('Failed to sync indexes', { error: (error as Error).message });
    }
  }

  private async seedAdmin(config: SeedConfig): Promise<void> {
    const existing = await this.userRepository.findByEmail(config.adminEmail);
    if (existing) {
      logger.info(`Admin user already exists: ${config.adminEmail}`);
      return;
    }

    await this.userRepository.create({
      email: config.adminEmail,
      name: config.adminName,
      role: UserRole.ADMIN,
      isActive: true,
    });

    logger.info(`Seeded admin user: ${config.adminEmail}`);
  }
}
