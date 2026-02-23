import { Router } from 'express';
import { planController } from './plan.controller';

const router = Router();

// Public: list active plans for frontend (pricing page, signup, etc.)
router.get('/', (req, res) => {
  planController.list(req, res);
});

export default router;
