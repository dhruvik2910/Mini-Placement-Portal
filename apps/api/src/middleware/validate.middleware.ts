import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('body' in schema.shape || 'query' in schema.shape || 'params' in schema.shape) {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) req.query = parsed.query;
        if (parsed.params !== undefined) req.params = parsed.params;
      } else {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
