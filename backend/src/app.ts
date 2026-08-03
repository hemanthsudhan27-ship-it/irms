import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import complexRoutes from './routes/complex.routes.js';
import floorRoutes from './routes/floor.routes.js';
import unitRoutes from './routes/unit.routes.js';
import residentRoutes from './routes/resident.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import activityLogRoutes from './routes/activity-log.routes.js';

export const createApp = (): Express => {
  const app: Express = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limit each IP to 300 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  });
  app.use(limiter);

  // Body parser & Cookie parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.cookie.secret));

  // Request Logging
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'IRMS Enterprise Backend API',
      environment: config.env,
    });
  });

  // API Base Route
  app.get(config.apiPrefix, (_req: Request, res: Response) => {
    res.status(200).json({
      message: 'Welcome to Integrated Residency Management System (IRMS) API v1',
    });
  });

  // Authentication Routes
  app.use(`${config.apiPrefix}/auth`, authRoutes);

  // Companies Routes
  app.use(`${config.apiPrefix}/companies`, companyRoutes);

  // Apartment Complexes Routes
  app.use(`${config.apiPrefix}/complexes`, complexRoutes);

  // Floors Routes
  app.use(`${config.apiPrefix}/floors`, floorRoutes);

  // Apartment Units Routes
  app.use(`${config.apiPrefix}/units`, unitRoutes);

  // Residents Routes
  app.use(`${config.apiPrefix}/residents`, residentRoutes);

  // Dashboard Stats Routes
  app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);

  // Activity Logs Audit Routes
  app.use(`${config.apiPrefix}/activity-logs`, activityLogRoutes);

  // 404 Handler
  app.use(notFoundMiddleware);

  // Centralized Error Middleware
  app.use(errorMiddleware);

  return app;
};
