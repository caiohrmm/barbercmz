import { Response } from 'express';
import { appointmentService } from './appointment.service';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { verifyRecaptcha } from '../../services/recaptcha.service';

export class AppointmentController {
  async requestVerification(req: AuthRequest | any, res: Response): Promise<void> {
    try {
      const data = {
        barbershopId: req.body.barbershopId,
        barberId: req.body.barberId,
        serviceId: req.body.serviceId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        startTime: new Date(req.body.startTime),
      };

      const result = await appointmentService.requestVerification(data);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Request verification error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async verifyAndCreate(req: AuthRequest | any, res: Response): Promise<void> {
    try {
      const { verificationId, code } = req.body;

      const appointment = await appointmentService.verifyAndCreateAppointment(
        verificationId,
        code
      );

      res.status(201).json({
        message: 'Appointment created successfully',
        appointment,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Verify appointment error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async create(req: AuthRequest | any, res: Response): Promise<void> {
    try {
      const { captchaToken, ...rest } = req.body;
      await verifyRecaptcha(captchaToken);

      const data = {
        barbershopId: rest.barbershopId,
        barberId: rest.barberId,
        serviceId: rest.serviceId,
        customerName: rest.customerName,
        customerPhone: rest.customerPhone,
        startTime: new Date(rest.startTime),
      };

      const appointment = await appointmentService.create(data);

      res.status(201).json({
        message: 'Appointment created successfully',
        appointment,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Create appointment error');
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

      const filters: any = {};

      if (req.query.status) {
        filters.status = req.query.status;
      }

      if (req.query.barberId) {
        filters.barberId = req.query.barberId as string;
      }

      if (req.query.customerId) {
        filters.customerId = req.query.customerId as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const appointments = await appointmentService.findAll(req.barbershopId, filters);

      res.status(200).json({
        appointments,
        count: appointments.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Get appointments error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.barbershopId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No barbershopId found',
        });
        return;
      }

      const { id } = req.params;
      const data = {
        status: req.body.status as 'scheduled' | 'completed' | 'cancelled' | 'no_show',
      };

      const appointment = await appointmentService.updateStatus(id, req.barbershopId, data);

      res.status(200).json({
        message: 'Appointment status updated successfully',
        appointment,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
        return;
      }

      logger.error(error, 'Update appointment status error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export const appointmentController = new AppointmentController();

