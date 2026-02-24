import { Barbershop } from '../barbershops/barbershop.model';
import { Subscription } from '../plans/subscription.model';

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

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
 */
export async function getCurrentSubscription(
  barbershopId: string
): Promise<SubscriptionMeResponse | null> {
  const barbershop = await Barbershop.findById(barbershopId).lean();
  if (!barbershop?.currentSubscriptionId) {
    return null;
  }

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
