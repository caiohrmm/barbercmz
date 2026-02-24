import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updatePlanSchema } from './subscription.schemas';

const router = Router();

router.get('/me', authenticate, (req, res) => {
  subscriptionController.me(req as import('../../middlewares/auth.middleware').AuthRequest, res);
});

router.patch(
  '/me/plan',
  authenticate,
  authorize('owner'),
  validate(updatePlanSchema),
  (req, res) => {
    subscriptionController.updatePlan(
      req as import('../../middlewares/auth.middleware').AuthRequest,
      res
    );
  }
);

export default router;
