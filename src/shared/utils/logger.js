'use strict';

const { config } = require('../../config');
const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) =>
    stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`
  )
);

const logger = winston.createLogger({
  level: config.logLevel,
  format: config.nodeEnv === 'production' ? logFormat : devFormat,
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'twk-admin-api' },
});

module.exports = { logger };
