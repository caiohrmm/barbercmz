import { Response } from 'express';
import { getCurrentSubscription } from './subscription.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';

export class SubscriptionController {
  /**
   * GET /subscriptions/me — current subscription + plan for the authenticated user's barbershop.
   */
  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const barbershopId = req.barbershopId;
      if (!barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const subscription = await getCurrentSubscription(barbershopId);

      res.status(200).json({ subscription });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }
      logger.error(error, 'Get subscription me error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
