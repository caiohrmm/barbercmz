import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/me', authenticate, (req, res) => {
  subscriptionController.me(req as import('../../middlewares/auth.middleware').AuthRequest, res);
});

export default router;
