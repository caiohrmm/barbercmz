import { Request, Response } from 'express';
import { barbershopService } from './barbershop.service';
import { serviceService } from '../services/service.service';
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

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const barbershop = await barbershopService.findBySlug(slug);

      res.status(200).json(barbershop);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get barbershop by slug error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async getPublicServices(req: Request, res: Response): Promise<void> {
    try {
      const { id: barbershopId } = req.params;

      const services = await serviceService.findAll(barbershopId, true);

      res.status(200).json({
        services,
        count: services.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get public services error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id: barbershopId } = req.params;
      const { date, serviceId } = req.query as { date: string; serviceId: string };

      const slots = await barbershopService.getAvailableSlots(
        barbershopId,
        date,
        serviceId
      );

      res.status(200).json({ slots });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get available slots error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const barbershopController = new BarbershopController();

