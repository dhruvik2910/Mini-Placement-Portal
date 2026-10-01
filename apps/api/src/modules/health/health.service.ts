import { HealthCheckResponse } from '@placement/shared';
import { checkDatabaseConnection } from '../../config/database';
import { env } from '../../config/env';

export class HealthService {
  async getHealthStatus(): Promise<HealthCheckResponse> {
    const dbHealth = await checkDatabaseConnection();

    return {
      status: dbHealth.connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      database: dbHealth,
    };
  }
}

export const healthService = new HealthService();
