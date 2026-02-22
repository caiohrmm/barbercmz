import { Response } from 'express';
import { serviceService } from './service.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class ServiceController {
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
        duration: req.body.duration,
        price: req.body.price,
        barbershopId: req.barbershopId,
      };

      const service = await serviceService.create(data);

      res.status(201).json({
        message: 'Service created successfully',
        service,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Create service error');
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

      const services = await serviceService.findAll(req.barbershopId, activeOnly);

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

      logger.error(error, 'Get services error');
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

      const service = await serviceService.update(id, req.barbershopId, data);

      res.status(200).json({
        message: 'Service updated successfully',
        service,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Update service error');
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

      await serviceService.delete(id, req.barbershopId);

      res.status(200).json({
        message: 'Service deleted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Delete service error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const serviceController = new ServiceController();

