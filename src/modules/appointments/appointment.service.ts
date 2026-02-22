import { Appointment } from './appointment.model';
import { Customer } from '../customers/customer.model';
import { Service } from '../services/service.model';
import { Barber } from '../barbers/barber.model';
import { Barbershop } from '../barbershops/barbershop.model';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface CreateAppointmentData {
  barbershopId: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
}

export interface UpdateAppointmentStatusData {
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

export interface AppointmentResponse {
  id: string;
  barbershopId: string;
  barberId: string;
  serviceId: string;
  customerId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt: Date;
}

export class AppointmentService {
  async create(data: CreateAppointmentData): Promise<AppointmentResponse> {
    // Verify barbershop exists and is active
    const barbershop = await Barbershop.findById(data.barbershopId);
    if (!barbershop || !barbershop.active) {
      throw new NotFoundError('Barbershop not found or inactive');
    }

    // Verify barber exists, is active, and belongs to barbershop
    const barber = await Barber.findOne({
      _id: data.barberId,
      barbershopId: data.barbershopId,
      active: true,
    });
    if (!barber) {
      throw new NotFoundError('Barber not found or inactive');
    }

    // Verify service exists, is active, and belongs to barbershop
    const service = await Service.findOne({
      _id: data.serviceId,
      barbershopId: data.barbershopId,
      active: true,
    });
    if (!service) {
      throw new NotFoundError('Service not found or inactive');
    }

    // Find or create customer
    let customer = await Customer.findOne({
      barbershopId: data.barbershopId,
      phone: data.customerPhone,
    });

    if (!customer) {
      customer = new Customer({
        name: data.customerName,
        phone: data.customerPhone,
        barbershopId: data.barbershopId,
        noShowCount: 0,
        blocked: false,
      });
      await customer.save();
    } else {
      // Update customer name if different
      if (customer.name !== data.customerName) {
        customer.name = data.customerName;
        await customer.save();
      }
    }

    // Business Rule 1: Check if customer is blocked
    if (customer.blocked) {
      throw new BadRequestError('Customer is blocked and cannot make appointments');
    }

    // Business Rule 2: Check limit of active appointments (max 2)
    const activeAppointmentsCount = await Appointment.countDocuments({
      barbershopId: data.barbershopId,
      customerId: customer._id,
      status: 'scheduled',
    });

    if (activeAppointmentsCount >= 2) {
      throw new BadRequestError('Customer already has 2 active appointments. Maximum limit reached.');
    }

    // Calculate endTime based on service duration
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

    // Business Rule 3: Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      barbershopId: data.barbershopId,
      barberId: data.barberId,
      status: 'scheduled',
      $or: [
        {
          // New appointment starts during existing appointment
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        {
          // New appointment ends during existing appointment
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
        {
          // New appointment completely contains existing appointment
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      ],
    });

    if (conflictingAppointment) {
      throw new BadRequestError('Time conflict: Barber already has an appointment at this time');
    }

    // Create appointment
    const appointment = new Appointment({
      barbershopId: data.barbershopId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      customerId: customer._id,
      startTime,
      endTime,
      status: 'scheduled',
    });

    await appointment.save();

    logger.info(
      {
        appointmentId: appointment._id,
        barbershopId: data.barbershopId,
        customerId: customer._id,
        startTime: appointment.startTime,
      },
      'Appointment created successfully'
    );

    return {
      id: appointment._id.toString(),
      barbershopId: appointment.barbershopId.toString(),
      barberId: appointment.barberId.toString(),
      serviceId: appointment.serviceId.toString(),
      customerId: appointment.customerId.toString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  async findAll(barbershopId: string, filters?: {
    status?: string;
    barberId?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AppointmentResponse[]> {
    const query: any = {
      barbershopId,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.barberId) {
      query.barberId = filters.barberId;
    }

    if (filters?.customerId) {
      query.customerId = filters.customerId;
    }

    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('barberId', 'name')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name phone')
      .sort({ startTime: 1 });

    return appointments.map((appointment) => ({
      id: appointment._id.toString(),
      barbershopId: appointment.barbershopId.toString(),
      barberId: appointment.barberId.toString(),
      serviceId: appointment.serviceId.toString(),
      customerId: appointment.customerId.toString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));
  }

  async updateStatus(
    id: string,
    barbershopId: string,
    data: UpdateAppointmentStatusData
  ): Promise<AppointmentResponse> {
    const appointment = await Appointment.findOne({
      _id: id,
      barbershopId,
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    const oldStatus = appointment.status;
    appointment.status = data.status;
    await appointment.save();

    // Business Rule 7: Block customer automatically if noShowCount >= 2
    if (data.status === 'no_show' && oldStatus !== 'no_show') {
      const customer = await Customer.findById(appointment.customerId);
      if (customer) {
        customer.noShowCount = (customer.noShowCount || 0) + 1;

        // Auto-block if noShowCount >= 2
        if (customer.noShowCount >= 2) {
          customer.blocked = true;
          logger.warn(
            {
              customerId: customer._id,
              noShowCount: customer.noShowCount,
            },
            'Customer automatically blocked due to no-show count'
          );
        }

        await customer.save();
      }
    }

    logger.info(
      {
        appointmentId: appointment._id,
        barbershopId,
        oldStatus,
        newStatus: data.status,
      },
      'Appointment status updated'
    );

    return {
      id: appointment._id.toString(),
      barbershopId: appointment.barbershopId.toString(),
      barberId: appointment.barberId.toString(),
      serviceId: appointment.serviceId.toString(),
      customerId: appointment.customerId.toString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}

export const appointmentService = new AppointmentService();

