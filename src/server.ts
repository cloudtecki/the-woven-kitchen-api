import 'reflect-metadata';
import { app } from './app';
import { config } from './config';
import { logger } from './shared/utils/logger';
import { MongoConnection } from './infrastructure/database/mongoose/connection';

const PORT = config.port;

async function bootstrap(): Promise<void> {
  try {
    await MongoConnection.getInstance().connect();
    logger.info(`MongoDB connected to database: ${config.dbName}`);
  } catch (error) {
    logger.error('Failed to connect to database while bootstrapping. Exiting.', {
      error: (error as Error).message,
    });
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API docs: http://localhost:${PORT}/api/docs`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await MongoConnection.getInstance().disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

bootstrap();

export default app;
