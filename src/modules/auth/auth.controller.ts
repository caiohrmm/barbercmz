import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import env from '../../config/env';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Login error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No refresh token provided',
        });
        return;
      }

      const result = await authService.refresh(refreshToken);

      res.status(200).json({
        accessToken: result.accessToken,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Refresh token error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    try {
      await authService.logout();

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error(error, 'Logout error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const authController = new AuthController();

