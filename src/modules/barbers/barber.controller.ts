import { Response } from 'express';
import { barberService } from './barber.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class BarberController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const data = {
        name: req.body.name,
        workingHours: req.body.workingHours,
        barbershopId: req.barbershopId,
      };

      const barber = await barberService.create(data);

      res.status(201).json({
        message: 'Barber created successfully',
        barber,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Create barber error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const activeOnly = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

      const barbers = await barberService.findAll(req.barbershopId, activeOnly);

      res.status(200).json({
        barbers,
        count: barbers.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get barbers error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const { id } = req.params;
      const data = req.body;

      const barber = await barberService.update(id, req.barbershopId, data);

      res.status(200).json({
        message: 'Barber updated successfully',
        barber,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Update barber error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const { id } = req.params;

      await barberService.delete(id, req.barbershopId);

      res.status(200).json({
        message: 'Barber deleted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Delete barber error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const barberController = new BarberController();

