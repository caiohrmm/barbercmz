import { Response } from 'express';
import { customerService } from './customer.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class CustomerController {
  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const filters: any = {};

      if (req.query.blocked !== undefined) {
        filters.blocked = req.query.blocked === 'true' ? true : req.query.blocked === 'false' ? false : undefined;
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const customers = await customerService.findAll(req.barbershopId, filters);

      res.status(200).json({
        customers,
        count: customers.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get customers error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async block(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const { id } = req.params;
      const { blocked } = req.body;

      const customer = await customerService.block(id, req.barbershopId, blocked);

      res.status(200).json({
        message: `Customer ${blocked ? 'blocked' : 'unblocked'} successfully`,
        customer,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Block customer error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const customerController = new CustomerController();

