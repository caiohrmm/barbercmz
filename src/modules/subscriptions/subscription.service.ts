import mongoose from 'mongoose';
import { Barbershop } from '../barbershops/barbershop.model';
import { Subscription } from '../plans/subscription.model';

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

/**
 * If subscription is trial and trialEndsAt has passed, updates status to 'suspended'.
 * Call this "on read" so we don't need a cron for trial expiry.
 */
export async function refreshTrialExpiry(
  subscriptionId: mongoose.Types.ObjectId
): Promise<void> {
  const now = new Date();
  await Subscription.updateOne(
    {
      _id: subscriptionId,
      status: 'trial',
      trialEndsAt: { $lt: now },
    },
    { $set: { status: 'suspended' } }
  );
}

export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  priceMonthly: number;
  maxBarbers: number;
  features: string[];
}

export interface SubscriptionMeResponse {
  id: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: SubscriptionPlanResponse;
}

/**
 * Returns the current subscription for the barbershop (linked by currentSubscriptionId).
 * Returns null if the barbershop has no subscription.
 * Updates trial to suspended if trialEndsAt has passed (on-read enforcement).
 */
export async function getCurrentSubscription(
  barbershopId: string
): Promise<SubscriptionMeResponse | null> {
  const barbershop = await Barbershop.findById(barbershopId).lean();
  if (!barbershop?.currentSubscriptionId) {
    return null;
  }

  await refreshTrialExpiry(barbershop.currentSubscriptionId as mongoose.Types.ObjectId);

  const subscription = await Subscription.findById(barbershop.currentSubscriptionId)
    .populate('planId')
    .lean()
    .exec();

  if (!subscription) {
    return null;
  }

  const plan = subscription.planId as unknown as {
    _id: { toString: () => string };
    name: string;
    priceMonthly: number;
    maxBarbers: number;
    features: string[];
  };

  if (!plan) {
    return null;
  }

  return {
    id: subscription._id.toString(),
    status: subscription.status as SubscriptionStatus,
    trialEndsAt: subscription.trialEndsAt
      ? subscription.trialEndsAt.toISOString()
      : null,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    plan: {
      id: plan._id.toString(),
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      maxBarbers: plan.maxBarbers,
      features: plan.features ?? [],
    },
  };
}
