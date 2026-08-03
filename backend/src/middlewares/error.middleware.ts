import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else {
    logger.error('Unhandled Error:', err);
    if (config.env === 'development') {
      message = err.message || message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  });
};
