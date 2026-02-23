import { Router } from 'express';
import { barberController } from './barber.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { checkBarberLimit } from '../../middlewares/checkBarberLimit.middleware';
import {
  createBarberSchema,
  getBarbersSchema,
  updateBarberSchema,
  deleteBarberSchema,
} from './barber.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All routes require owner or barber role
router.use(authorize('owner', 'barber'));

router.post('/', checkBarberLimit, validate(createBarberSchema), (req, res) => {
  barberController.create(req, res);
});

router.get('/', validate(getBarbersSchema), (req, res) => {
  barberController.findAll(req, res);
});

router.patch('/:id', validate(updateBarberSchema), (req, res) => {
  barberController.update(req, res);
});

router.delete('/:id', validate(deleteBarberSchema), (req, res) => {
  barberController.delete(req, res);
});

export default router;

