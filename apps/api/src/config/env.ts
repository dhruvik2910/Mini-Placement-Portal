import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local api directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URI').default(
    'postgresql://postgres:postgres@localhost:5432/placement_portal?schema=public'
  ),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default(
    'default_dev_secret_key_change_in_production'
  ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
