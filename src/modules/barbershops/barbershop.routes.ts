import { Router } from 'express';
import { barbershopController } from './barbershop.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBarbershopOwner } from '../../middlewares/validateBarbershopOwner.middleware';
import { uploadLogo as multerUploadLogo } from '../../config/multer';
import {
  createBarbershopSchema,
  getBarbershopSchema,
  getBarbershopBySlugSchema,
  getBarbershopServicesSchema,
  getAvailableSlotsSchema,
} from './barbershop.schemas';

const router = Router();

router.post('/', validate(createBarbershopSchema), (req, res) => {
  barbershopController.create(req, res);
});

// Must be before /:id so "slug" is not captured as id
router.get('/slug/:slug', validate(getBarbershopBySlugSchema), (req, res) => {
  barbershopController.getBySlug(req, res);
});

// Logo upload (owner only, own barbershop)
router.post(
  '/:id/logo',
  authenticate,
  authorize('owner'),
  validate(getBarbershopSchema),
  validateBarbershopOwner,
  (req, res, next) => {
    multerUploadLogo(req, res, (err: unknown) => {
      if (err) {
        return next(err);
      }
      barbershopController.uploadLogo(req as import('../../middlewares/auth.middleware').AuthRequest, res);
    });
  }
);

router.get('/:id/services', validate(getBarbershopServicesSchema), (req, res) => {
  barbershopController.getPublicServices(req, res);
});

router.get(
  '/:id/available-slots',
  validate(getAvailableSlotsSchema),
  (req, res) => {
    barbershopController.getAvailableSlots(req, res);
  }
);

router.get('/:id', validate(getBarbershopSchema), (req, res) => {
  barbershopController.getById(req, res);
});

export default router;

