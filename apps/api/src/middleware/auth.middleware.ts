import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@placement/shared';
import { AppError } from '../common/errors/app-error';
import { verifyJwtToken } from '../common/utils/jwt';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  studentProfileId?: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

/**
 * Authentication verification middleware
 * Extracts and validates JWT bearer tokens
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJwtToken(token);
    req.user = payload;
    next();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid token';
    throw AppError.unauthorized(`Authentication token is invalid or expired: ${msg}`);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if valid token present, but does not block if omitted
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyJwtToken(token);
      req.user = payload;
    } catch {
      // Ignore token decode failure on optional routes
    }
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces permissions for STUDENT and TPO roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('User must be authenticated to access this resource');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  };
}
