import mongoose from 'mongoose';
import { config } from '../../../config';
import { logger } from '../../../shared/utils/logger';

export class MongoConnection {
  private static instance: MongoConnection | null = null;

  private constructor() {}

  static getInstance(): MongoConnection {
    if (!this.instance) {
      this.instance = new MongoConnection();
    }
    return this.instance;
  }

  async connect(): Promise<void> {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB connected to database: ${config.dbName}`);
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    try {
      await mongoose.connect(config.mongoUri, {
        dbName: config.dbName,
        autoIndex: !isProd(),
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

function isProd(): boolean {
  return config.nodeEnv === 'production';
}
