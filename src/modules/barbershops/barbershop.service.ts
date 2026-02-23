import mongoose from 'mongoose';
import { Barbershop } from './barbershop.model';
import { User } from '../users/user.model';
import { Plan } from '../plans/plan.model';
import { Subscription } from '../plans/subscription.model';
import { Barber } from '../barbers/barber.model';
import { Service } from '../services/service.model';
import { Appointment } from '../appointments/appointment.model';
import { hashPassword } from '../../utils/password';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { generateSlug } from './barbershop.schemas';

const SLOT_STEP_MINUTES = 30;

/** Dias grátis de demonstração para novas barbearias com plano. */
const TRIAL_DAYS = 30;

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface CreateBarbershopData {
  name: string;
  slug?: string;
  planId?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface BarbershopResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  planId?: string;
  maxBarbers: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BarbershopService {
  async create(data: CreateBarbershopData): Promise<BarbershopResponse> {
    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingBarbershop = await Barbershop.findOne({ slug });
    if (existingBarbershop) {
      throw new ConflictError('A barbershop with this slug already exists');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.ownerEmail.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Validate plan if provided
    let plan = null;
    let maxBarbers = 1;

    if (data.planId) {
      plan = await Plan.findById(data.planId);
      if (!plan || !plan.active) {
        throw new BadRequestError('Invalid or inactive plan');
      }
      maxBarbers = plan.maxBarbers;
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create barbershop
      const barbershop = new Barbershop({
        name: data.name,
        slug,
        planId: plan?._id,
        maxBarbers,
        active: true,
      });

      await barbershop.save({ session });

      // Hash owner password
      const passwordHash = await hashPassword(data.ownerPassword);

      // Create owner user
      const owner = new User({
        name: data.ownerName,
        email: data.ownerEmail.toLowerCase(),
        passwordHash,
        role: 'owner',
        barbershopId: barbershop._id,
        active: true,
      });

      await owner.save({ session });

      // Create subscription if plan is provided (sempre 30 dias grátis para demonstração)
      if (plan) {
        const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        const subscription = new Subscription({
          barbershopId: barbershop._id,
          planId: plan._id,
          status: 'trial',
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
          trialEndsAt,
        });

        await subscription.save({ session });

        barbershop.currentSubscriptionId = subscription._id;
        await barbershop.save({ session });
      }

      // Commit transaction
      await session.commitTransaction();

      logger.info(
        {
          barbershopId: barbershop._id,
          ownerId: owner._id,
          slug: barbershop.slug,
        },
        'Barbershop created successfully'
      );

      return {
        id: barbershop._id.toString(),
        name: barbershop.name,
        slug: barbershop.slug,
        logoUrl: barbershop.logoUrl,
        planId: barbershop.planId?.toString(),
        maxBarbers: barbershop.maxBarbers,
        active: barbershop.active,
        createdAt: barbershop.createdAt,
        updatedAt: barbershop.updatedAt,
      };
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findById(id: string): Promise<BarbershopResponse> {
    const barbershop = await Barbershop.findById(id);

    if (!barbershop) {
      throw new NotFoundError('Barbershop not found');
    }

    return {
      id: barbershop._id.toString(),
      name: barbershop.name,
      slug: barbershop.slug,
      logoUrl: barbershop.logoUrl,
      planId: barbershop.planId
        ? typeof barbershop.planId === 'object'
          ? barbershop.planId.toString()
          : barbershop.planId
        : undefined,
      maxBarbers: barbershop.maxBarbers,
      active: barbershop.active,
      createdAt: barbershop.createdAt,
      updatedAt: barbershop.updatedAt,
    };
  }

  async findBySlug(slug: string): Promise<BarbershopResponse> {
    const barbershop = await Barbershop.findOne({ slug });

    if (!barbershop) {
      throw new NotFoundError('Barbershop not found');
    }

    return {
      id: barbershop._id.toString(),
      name: barbershop.name,
      slug: barbershop.slug,
      logoUrl: barbershop.logoUrl,
      planId: barbershop.planId
        ? typeof barbershop.planId === 'object'
          ? barbershop.planId.toString()
          : barbershop.planId
        : undefined,
      maxBarbers: barbershop.maxBarbers,
      active: barbershop.active,
      createdAt: barbershop.createdAt,
      updatedAt: barbershop.updatedAt,
    };
  }

  async updateLogoUrl(id: string, logoUrl: string): Promise<BarbershopResponse> {
    const barbershop = await Barbershop.findByIdAndUpdate(
      id,
      { logoUrl },
      { new: true }
    );
    if (!barbershop) {
      throw new NotFoundError('Barbershop not found');
    }
    return {
      id: barbershop._id.toString(),
      name: barbershop.name,
      slug: barbershop.slug,
      logoUrl: barbershop.logoUrl,
      planId: barbershop.planId?.toString(),
      maxBarbers: barbershop.maxBarbers,
      active: barbershop.active,
      createdAt: barbershop.createdAt,
      updatedAt: barbershop.updatedAt,
    };
  }

  /**
   * Get available time slots for a date and service (public booking).
   * Returns slots as { time: "HH:mm", barberId, barberName } in local date.
   */
  async getAvailableSlots(
    barbershopId: string,
    dateStr: string,
    serviceId: string
  ): Promise<{ time: string; barberId: string; barberName: string }[]> {
    const barbershop = await Barbershop.findById(barbershopId);
    if (!barbershop || !barbershop.active) {
      throw new NotFoundError('Barbershop not found or inactive');
    }

    const service = await Service.findOne({
      _id: serviceId,
      barbershopId,
      active: true,
    });
    if (!service) {
      throw new NotFoundError('Service not found or inactive');
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();

    const barbers = await Barber.find({ barbershopId, active: true }).lean();
    const slots: { time: string; barberId: string; barberName: string }[] = [];

    for (const barber of barbers) {
      const wh = barber.workingHours?.find(
        (w: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) =>
          w.dayOfWeek === dayOfWeek && w.isAvailable !== false
      );
      if (!wh) continue;

      const startMin = timeToMinutes(wh.startTime);
      const endMin = timeToMinutes(wh.endTime);
      const durationMin = service.duration;
      const lastStartMin = endMin - durationMin;
      if (lastStartMin < startMin) continue;

      for (let min = startMin; min <= lastStartMin; min += SLOT_STEP_MINUTES) {
        const timeStr = minutesToTime(min);
        const slotStart = new Date(y, m - 1, d, Math.floor(min / 60), min % 60);
        const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

        const conflict = await Appointment.findOne({
          barbershopId: new mongoose.Types.ObjectId(barbershopId),
          barberId: barber._id,
          status: 'scheduled',
          $or: [
            { startTime: { $lt: slotEnd }, endTime: { $gt: slotStart } },
          ],
        });
        if (conflict) continue;

        slots.push({
          time: timeStr,
          barberId: barber._id.toString(),
          barberName: barber.name,
        });
      }
    }

    slots.sort((a, b) => a.time.localeCompare(b.time) || a.barberName.localeCompare(b.barberName));
    return slots;
  }
}

export const barbershopService = new BarbershopService();

