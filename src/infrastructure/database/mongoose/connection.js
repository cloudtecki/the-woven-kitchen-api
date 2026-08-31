'use strict';

const mongoose = require('mongoose');
const { config, isProd } = require('../../../config');
const { logger } = require('../../../shared/utils/logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected to database: ${config.dbName}`);
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(config.mongoUri, {
    dbName: config.dbName,
    autoIndex: !isProd,
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
