import { Request, Response } from 'express';
import { barbershopService } from './barbershop.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';

export class BarbershopController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;

      const barbershop = await barbershopService.create(data);

      res.status(201).json({
        message: 'Barbershop created successfully',
        barbershop,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Create barbershop error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const barbershop = await barbershopService.findById(id);

      res.status(200).json(barbershop);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get barbershop error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const barbershopController = new BarbershopController();

