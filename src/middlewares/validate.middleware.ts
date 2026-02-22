import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.warn({ errors }, 'Validation error');

        res.status(400).json({
          error: 'Validation Error',
          details: errors,
        });
        return;
      }

      logger.error(error, 'Unexpected validation error');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

