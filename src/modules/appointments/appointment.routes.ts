import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { appointmentRateLimit } from '../../config/security';
import {
  createAppointmentWithCaptchaSchema,
  requestVerificationSchema,
  verifyAppointmentSchema,
  getAppointmentsSchema,
  updateAppointmentStatusSchema,
} from './appointment.schemas';

const router = Router();

// Public: request SMS verification (sends code, returns verificationId)
router.post(
  '/request-verification',
  appointmentRateLimit,
  validate(requestVerificationSchema),
  (req, res) => {
    appointmentController.requestVerification(req, res);
  }
);

// Public: verify code and create appointment
router.post(
  '/verify',
  appointmentRateLimit,
  validate(verifyAppointmentSchema),
  (req, res) => {
    appointmentController.verifyAndCreate(req, res);
  }
);

// Public: create appointment (requires captcha). SMS flow (request-verification + verify) kept inactive for future use.
router.post(
  '/',
  appointmentRateLimit,
  validate(createAppointmentWithCaptchaSchema),
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

