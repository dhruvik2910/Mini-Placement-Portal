import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  // 1. Handled AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      timestamp,
    });
    return;
  }

  // 2. Zod Request Validation Error
  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: fieldErrors,
      timestamp,
    });
    return;
  }

  // 3. Prisma Unique Constraint / Known Error Check
  const errorWithCode = err as { code?: string; meta?: { target?: string[] } };
  if (errorWithCode.code === 'P2002') {
    const targetFields = errorWithCode.meta?.target?.join(', ') || 'field';
    res.status(409).json({
      success: false,
      statusCode: 409,
      message: `A record with this ${targetFields} already exists.`,
      timestamp,
    });
    return;
  }

  // 4. Uncaught / Generic 500
  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp,
  });
};
