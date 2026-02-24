import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/me',
  authenticate,
  authorize('owner'),
  (req, res) => {
    paymentController.me(req as import('../../middlewares/auth.middleware').AuthRequest, res);
  }
);

router.post(
  '/mock',
  authenticate,
  authorize('owner'),
  (req, res) => {
    paymentController.mock(req as import('../../middlewares/auth.middleware').AuthRequest, res);
  }
);

export default router;
