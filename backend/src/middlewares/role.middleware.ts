import { Response, NextFunction } from 'express';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

/**
 * Restrict endpoint access to specified role slugs (e.g. 'super_admin', 'complex_admin')
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const { roleSlug } = req.user;
    if (!allowedRoles.includes(roleSlug)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${roleSlug}' does not have permission to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Enforce complex isolation: Complex Admins can ONLY operate on their assigned complex
 */
export const enforceComplexScope = (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('User not authenticated'));
  }

  // Super Admin has global access to all complexes
  if (req.user.roleSlug === 'super_admin') {
    return next();
  }

  // Complex Admin must have an assigned complexId
  if (req.user.roleSlug === 'complex_admin') {
    if (!req.user.complexId) {
      return next(new ForbiddenError('Complex Admin is not assigned to any complex.'));
    }

    // Check if req params or query or body includes a complexId that differs
    const paramComplexId = req.params.complexId || req.query.complexId || req.body.complexId;
    if (paramComplexId && paramComplexId !== req.user.complexId) {
      return next(new ForbiddenError('Unauthorized: Complex Admin cannot access or modify another complex.'));
    }
  }

  next();
};
