import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';

/**
 * Ensures the authenticated user can only access their own barbershop.
 * Use after authenticate + authorize('owner'). Expects req.params.id to be the barbershop id.
 */
export function validateBarbershopOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const barbershopId = req.params.id;
  if (!barbershopId || barbershopId !== req.barbershopId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only update your own barbershop',
    });
    return;
  }
  next();
}
