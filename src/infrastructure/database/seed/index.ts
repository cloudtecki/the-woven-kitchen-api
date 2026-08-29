import 'reflect-metadata';
import { MongoConnection } from '../mongoose/connection';
import { container } from '../../di/container';
import { TYPES } from '../../../shared/constants/tokens';
import { DatabaseSeeder, SeedConfig } from './seeder';
import { IUserRepository } from '../../../domain/repositories/user-repository.interface';
import { logger } from '../../../shared/utils/logger';

const seedConfig: SeedConfig = {
  adminEmail: (process.env.SEED_ADMIN_EMAIL || 'admin@thewovencloudkitchen.com').toLowerCase(),
  adminName: process.env.SEED_ADMIN_NAME || 'System Administrator',
};

async function main(): Promise<void> {
  await MongoConnection.getInstance().connect();

  const seeder = new DatabaseSeeder(
    container.get<IUserRepository>(TYPES.UserRepository)
  );

  await seeder.run(seedConfig);

  logger.info('Seeding completed');
  await MongoConnection.getInstance().disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  logger.error('Seeding failed', { error: (error as Error).message });
  await MongoConnection.getInstance().disconnect();
  process.exit(1);
});
