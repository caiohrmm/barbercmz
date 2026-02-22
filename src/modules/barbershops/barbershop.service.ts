import mongoose from 'mongoose';
import { Barbershop } from './barbershop.model';
import { User } from '../users/user.model';
import { Plan } from '../plans/plan.model';
import { Subscription } from '../plans/subscription.model';
import { hashPassword } from '../../utils/password';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { generateSlug } from './barbershop.schemas';

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

      // Create subscription if plan is provided
      if (plan) {
        const subscription = new Subscription({
          barbershopId: barbershop._id,
          planId: plan._id,
          status: 'trial',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        });

        await subscription.save({ session });
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
}

export const barbershopService = new BarbershopService();

