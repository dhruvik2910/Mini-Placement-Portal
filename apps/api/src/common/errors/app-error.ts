export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    statusCode = 500,
    errors?: Array<{ field?: string; message: string }>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Array<{ field?: string; message: string }>) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Access forbidden: insufficient permissions') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Requested resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static unprocessable(message: string, errors?: Array<{ field?: string; message: string }>) {
    return new AppError(message, 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, undefined, false);
  }
}
