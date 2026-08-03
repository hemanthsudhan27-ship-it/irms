import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { IAuthenticatedRequest, IJwtPayload } from '../interfaces/auth.interface.js';
import { UnauthorizedError } from '../errors/app-error.js';

export const authenticate = (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // Check Authorization Header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback: Check cookies for access_token
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as IJwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(err);
    }
  }
};
