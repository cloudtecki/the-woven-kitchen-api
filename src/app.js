'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

const { config, isProd } = require('./config');
const { swaggerSpec } = require('./config/swagger');
const apiRoutes = require('./api/routes');
const { requestLogger, errorHandler, notFoundHandler } = require('./api/middlewares');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (!isProd) {
  app.use(requestLogger);
}

app.use(config.apiPrefix, apiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
