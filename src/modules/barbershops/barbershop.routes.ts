import { Router } from 'express';
import { barbershopController } from './barbershop.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createBarbershopSchema, getBarbershopSchema } from './barbershop.schemas';

const router = Router();

router.post('/', validate(createBarbershopSchema), (req, res) => {
  barbershopController.create(req, res);
});

router.get('/:id', validate(getBarbershopSchema), (req, res) => {
  barbershopController.getById(req, res);
});

export default router;

