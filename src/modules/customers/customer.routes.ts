import { Router } from 'express';
import { customerController } from './customer.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requireActiveSubscription } from '../../middlewares/requireActiveSubscription.middleware';
import { getCustomersSchema, blockCustomerSchema } from './customer.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All routes require owner or barber role
router.use(authorize('owner', 'barber'));

router.use(requireActiveSubscription);

router.get('/', validate(getCustomersSchema), (req, res) => {
  customerController.findAll(req, res);
});

router.patch('/:id/block', validate(blockCustomerSchema), (req, res) => {
  customerController.block(req, res);
});

export default router;

