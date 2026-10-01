import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Resource not found on endpoint: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
}
