import mongoose from 'mongoose';
import { Barbershop } from '../barbershops/barbershop.model';
import { Subscription } from '../plans/subscription.model';
import { Plan } from '../plans/plan.model';
import { Barber } from '../barbers/barber.model';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

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

/**
 * Change the barbershop's plan (upgrade/downgrade without payment).
 * Only owner may call. On downgrade, barbersActiveCount must be <= newPlan.maxBarbers.
 * Updates subscription.planId and barbershop.planId + barbershop.maxBarbers.
 */
export async function changePlan(
  barbershopId: string,
  planId: string,
  isOwner: boolean
): Promise<SubscriptionMeResponse | null> {
  if (!isOwner) {
    throw new ForbiddenError('Apenas o dono da barbearia pode alterar o plano.');
  }

  const barbershop = await Barbershop.findById(barbershopId);
  if (!barbershop) {
    throw new NotFoundError('Barbearia não encontrada.');
  }

  const subscriptionId = barbershop.currentSubscriptionId;
  if (!subscriptionId) {
    throw new BadRequestError('Sua barbearia não possui assinatura. Escolha um plano no cadastro.');
  }

  const newPlan = await Plan.findById(planId);
  if (!newPlan || !newPlan.active) {
    throw new BadRequestError('Plano inválido ou inativo.');
  }

  const subscription = await Subscription.findById(subscriptionId)
    .populate('planId')
    .lean()
    .exec();
  if (!subscription) {
    throw new NotFoundError('Assinatura não encontrada.');
  }

  const currentPlan = subscription.planId as unknown as { maxBarbers: number } | null;
  const currentMaxBarbers = currentPlan?.maxBarbers ?? 1;

  if (newPlan.maxBarbers < currentMaxBarbers) {
    const barbershopObjectId = new mongoose.Types.ObjectId(barbershopId);
    const activeCount = await Barber.countDocuments({
      barbershopId: barbershopObjectId,
      active: true,
    });
    if (activeCount > newPlan.maxBarbers) {
      throw new BadRequestError(
        `Reduza o número de barbeiros ativos antes de trocar para este plano. Você tem ${activeCount} barbeiro(s) ativo(s) e o plano "${newPlan.name}" permite até ${newPlan.maxBarbers}. Desative ou remova ${activeCount - newPlan.maxBarbers} barbeiro(s).`
      );
    }
  }

  const newPlanObjectId = new mongoose.Types.ObjectId(planId);

  await Subscription.updateOne(
    { _id: subscriptionId },
    { $set: { planId: newPlanObjectId } }
  );

  await Barbershop.updateOne(
    { _id: barbershopId },
    { $set: { planId: newPlanObjectId, maxBarbers: newPlan.maxBarbers } }
  );

  return getCurrentSubscription(barbershopId);
}
