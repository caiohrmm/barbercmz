import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { appointmentRateLimit } from '../../config/security';
import {
  createAppointmentSchema,
  getAppointmentsSchema,
  updateAppointmentStatusSchema,
} from './appointment.schemas';

const router = Router();

// Public route for creating appointments (with rate limit)
router.post(
  '/',
  appointmentRateLimit,
  validate(createAppointmentSchema),
  (req, res) => {
    appointmentController.create(req, res);
  }
);

// Authenticated routes
router.get(
  '/',
  authenticate,
  authorize('owner', 'barber'),
  validate(getAppointmentsSchema),
  (req, res) => {
    appointmentController.findAll(req, res);
  }
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('owner', 'barber'),
  validate(updateAppointmentStatusSchema),
  (req, res) => {
    appointmentController.updateStatus(req, res);
  }
);

export default router;

