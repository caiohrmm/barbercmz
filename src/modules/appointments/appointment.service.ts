import { Appointment } from './appointment.model';
import { PendingVerification } from './pending-verification.model';
import { Customer } from '../customers/customer.model';
import { Service } from '../services/service.model';
import { Barber } from '../barbers/barber.model';
import { Barbershop } from '../barbershops/barbershop.model';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { sendVerificationSms } from '../../services/sms.service';
import logger from '../../utils/logger';

const CODE_EXPIRY_MINUTES = 10;
const MAX_PENDING_PER_PHONE_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

export interface AppointmentListResponse extends AppointmentResponse {
  barber?: { id: string; name: string };
  service?: { id: string; name: string; duration: number; price: number };
  customer?: { id: string; name: string; phone: string };
}

export interface RequestVerificationResponse {
  verificationId: string;
  message: string;
}

export class AppointmentService {
  /**
   * Request SMS verification: creates a pending verification, sends code, returns verificationId.
   * Rate limited per phone.
   */
  async requestVerification(data: CreateAppointmentData): Promise<RequestVerificationResponse> {
    const barbershop = await Barbershop.findById(data.barbershopId);
    if (!barbershop || !barbershop.active) {
      throw new NotFoundError('Barbershop not found or inactive');
    }

    const barber = await Barber.findOne({
      _id: data.barberId,
      barbershopId: data.barbershopId,
      active: true,
    });
    if (!barber) {
      throw new NotFoundError('Barber not found or inactive');
    }

    const service = await Service.findOne({
      _id: data.serviceId,
      barbershopId: data.barbershopId,
      active: true,
    });
    if (!service) {
      throw new NotFoundError('Service not found or inactive');
    }

    // Rate limit: max N pending verifications per phone in the last window
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await PendingVerification.countDocuments({
      customerPhone: data.customerPhone,
      createdAt: { $gte: since },
    });
    if (recentCount >= MAX_PENDING_PER_PHONE_PER_WINDOW) {
      throw new BadRequestError(
        'Muitas tentativas. Aguarde alguns minutos antes de solicitar um novo código.'
      );
    }

    const startTime = new Date(data.startTime);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    const code = generateCode();

    const pending = new PendingVerification({
      barbershopId: data.barbershopId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      startTime,
      code,
      expiresAt,
    });
    await pending.save();

    await sendVerificationSms(data.customerPhone, code);

    logger.info(
      { verificationId: pending._id, barbershopId: data.barbershopId },
      'Verification requested'
    );

    return {
      verificationId: pending._id.toString(),
      message: 'Código enviado por SMS',
    };
  }

  /**
   * Verify code and create the appointment. Deletes pending on success.
   */
  async verifyAndCreateAppointment(
    verificationId: string,
    code: string
  ): Promise<AppointmentResponse> {
    const pending = await PendingVerification.findById(verificationId);
    if (!pending) {
      throw new BadRequestError('Link expirado ou inválido. Solicite um novo código.');
    }
    if (pending.code !== code.trim()) {
      throw new BadRequestError('Código incorreto. Tente novamente.');
    }
    if (new Date() > pending.expiresAt) {
      await PendingVerification.findByIdAndDelete(verificationId);
      throw new BadRequestError('Código expirado. Solicite um novo código.');
    }

    const data: CreateAppointmentData = {
      barbershopId: pending.barbershopId.toString(),
      barberId: pending.barberId.toString(),
      serviceId: pending.serviceId.toString(),
      customerName: pending.customerName,
      customerPhone: pending.customerPhone,
      startTime: pending.startTime,
    };

    const appointment = await this.create(data);
    await PendingVerification.findByIdAndDelete(verificationId);

    logger.info(
      { appointmentId: appointment.id, verificationId },
      'Appointment confirmed via SMS'
    );

    return appointment;
  }

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
  }): Promise<AppointmentListResponse[]> {
    const query: Record<string, unknown> = {
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
        (query.startTime as Record<string, Date>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.startTime as Record<string, Date>).$lte = filters.endDate;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('barberId', 'name')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name phone')
      .sort({ startTime: 1 })
      .lean();

    return appointments.map((apt) => {
      const barber = apt.barberId as { _id: { toString: () => string }; name: string } | null;
      const service = apt.serviceId as { _id: { toString: () => string }; name: string; duration: number; price: number } | null;
      const customer = apt.customerId as { _id: { toString: () => string }; name: string; phone: string } | null;

      const barberIdStr = barber?._id ? barber._id.toString() : String(apt.barberId);
      const serviceIdStr = service?._id ? service._id.toString() : String(apt.serviceId);
      const customerIdStr = customer?._id ? customer._id.toString() : String(apt.customerId);

      return {
        id: (apt._id as { toString: () => string }).toString(),
        barbershopId: (apt.barbershopId as { toString: () => string }).toString(),
        barberId: barberIdStr,
        serviceId: serviceIdStr,
        customerId: customerIdStr,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
        barber: barber ? { id: barber._id.toString(), name: barber.name } : undefined,
        service: service ? { id: service._id.toString(), name: service.name, duration: service.duration, price: service.price } : undefined,
        customer: customer ? { id: customer._id.toString(), name: customer.name, phone: customer.phone } : undefined,
      };
    });
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

