import { Router } from 'express';
import { serviceController } from './service.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requireActiveSubscription } from '../../middlewares/requireActiveSubscription.middleware';
import {
  createServiceSchema,
  getServicesSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from './service.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All routes require owner or barber role
router.use(authorize('owner', 'barber'));

router.use(requireActiveSubscription);

router.post('/', validate(createServiceSchema), (req, res) => {
  serviceController.create(req, res);
});

router.get('/', validate(getServicesSchema), (req, res) => {
  serviceController.findAll(req, res);
});

router.patch('/:id', validate(updateServiceSchema), (req, res) => {
  serviceController.update(req, res);
});

router.delete('/:id', validate(deleteServiceSchema), (req, res) => {
  serviceController.delete(req, res);
});

export default router;

