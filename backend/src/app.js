import express from 'express';
import morgan from 'morgan';
import { apiRoutes } from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import { securityMiddleware } from './middlewares/security.js';
import { env } from './config/env.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(securityMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isProduction) app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
  app.use('/api/v1', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
