import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  barbershopId?: string;
  role?: 'owner' | 'barber';
}

export interface JWTPayload {
  userId: string;
  barbershopId: string;
  role: 'owner' | 'barber';
  email: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      req.userId = decoded.userId;
      req.barbershopId = decoded.barbershopId;
      req.role = decoded.role;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
        return;
      }
      throw error;
    }
  } catch (error) {
    logger.error(error, 'Authentication error');
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

export const authorize = (...allowedRoles: ('owner' | 'barber')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(401).json({ error: 'Unauthorized', message: 'No role found' });
      return;
    }

    if (!allowedRoles.includes(req.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const validateBarbershopAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.barbershopId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No barbershopId found in token',
    });
    return;
  }

  // If barbershopId is in params, validate it matches the token
  const paramBarbershopId = req.params.barbershopId;
  if (paramBarbershopId && paramBarbershopId !== req.barbershopId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Cannot access data from another barbershop',
    });
    return;
  }

  next();
};

