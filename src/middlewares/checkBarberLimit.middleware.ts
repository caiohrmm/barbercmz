import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Barbershop } from '../modules/barbershops/barbershop.model';
import { Subscription } from '../modules/plans/subscription.model';
import { Plan } from '../modules/plans/plan.model';
import { Barber } from '../modules/barbers/barber.model';
import { AuthRequest } from './auth.middleware';

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trial'] as const;

/**
 * Blocks creating a new barber if the barbershop has reached maxBarbers from its plan.
 * Uses currentSubscriptionId when set; otherwise falls back to barbershop.maxBarbers.
 */
export const checkBarberLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const barbershopId = req.barbershopId;
  if (!barbershopId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No barbershopId found in token',
    });
    return;
  }

  (async () => {
    try {
      const barbershop = await Barbershop.findById(barbershopId).lean();
      if (!barbershop) {
        res.status(404).json({ error: 'Barbershop not found' });
        return;
      }

      let maxBarbers = barbershop.maxBarbers;

      const subscriptionId = barbershop.currentSubscriptionId;
      if (subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId)
          .lean()
          .exec();
        if (
          subscription &&
          ACTIVE_SUBSCRIPTION_STATUSES.includes(
            subscription.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
          )
        ) {
          const plan = await Plan.findById(subscription.planId).lean().exec();
          if (plan) {
            maxBarbers = plan.maxBarbers;
          }
        }
      }

      const currentCount = await Barber.countDocuments({
        barbershopId: new mongoose.Types.ObjectId(barbershopId),
        active: true,
      });

      if (currentCount >= maxBarbers) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Barber limit reached for your plan (${maxBarbers} barber(s)). Upgrade to add more.`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  })();
};
