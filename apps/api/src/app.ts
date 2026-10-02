import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { v1Router } from './routes/v1.router';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';

import path from 'path';

export function createApp(): Application {
  const app = express();

  // Basic Security & Parsing Middleware
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : [env.CORS_ORIGIN, 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads serving (Serverless compatible: uses os.tmpdir on Vercel)
  const staticUploadsDir = process.env.VERCEL
    ? path.join(require('os').tmpdir(), 'uploads')
    : path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(staticUploadsDir));

  // Request logger middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (env.NODE_ENV !== 'test') {
      const now = new Date().toISOString();
      console.log(`[${now}] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // Root redirect/status
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'College Mini Placement Portal API',
      status: 'online',
      documentation: `/api/${env.API_VERSION}/health`,
    });
  });

  // Mount API version prefix: /api/v1
  app.use(`/api/${env.API_VERSION}`, v1Router);

  // Fallthrough 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
