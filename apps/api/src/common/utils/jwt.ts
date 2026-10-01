import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticatedUserPayload } from '../../middleware/auth.middleware';

export function signJwtToken(payload: AuthenticatedUserPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyJwtToken(token: string): AuthenticatedUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;
}
