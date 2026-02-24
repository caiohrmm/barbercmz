import { Response } from 'express';
import { listPaymentsForMe, createMockPayment } from './payment.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import env from '../../config/env';

export class PaymentController {
  /**
   * GET /payments/me — list payments for the barbershop's subscription (owner only).
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

      const result = await listPaymentsForMe(barbershopId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }
      logger.error(error, 'Get payments me error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /payments/mock — create a mock paid payment (development only).
   */
  async mock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const barbershopId = req.barbershopId;
      if (!barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const isDev = env.NODE_ENV !== 'production';
      const payment = await createMockPayment(barbershopId, isDev);
      res.status(201).json({ payment });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }
      logger.error(error, 'Create mock payment error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const paymentController = new PaymentController();
