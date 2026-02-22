import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, refreshSchema, logoutSchema } from './auth.schemas';

const router = Router();

router.post('/login', validate(loginSchema), (req, res) => {
  authController.login(req, res);
});

router.post('/refresh', validate(refreshSchema), (req, res) => {
  authController.refresh(req, res);
});

router.post('/logout', validate(logoutSchema), (req, res) => {
  authController.logout(req, res);
});

export default router;

