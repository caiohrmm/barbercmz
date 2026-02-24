import mongoose from 'mongoose';
import { Barbershop } from '../barbershops/barbershop.model';
import { Payment } from '../plans/payment.model';
import { Subscription } from '../plans/subscription.model';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'pix' | 'card' | 'boleto';

export interface PaymentListItem {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentsMeResponse {
  payments: PaymentListItem[];
}

/**
 * List payments for the barbershop's current subscription. Owner only (enforced in route).
 */
export async function listPaymentsForMe(
  barbershopId: string
): Promise<PaymentsMeResponse> {
  const barbershop = await Barbershop.findById(barbershopId).lean();
  if (!barbershop) {
    throw new NotFoundError('Barbearia não encontrada.');
  }

  const subscriptionId = barbershop.currentSubscriptionId;
  if (!subscriptionId) {
    return { payments: [] };
  }

  const payments = await Payment.find({
    subscriptionId: subscriptionId as mongoose.Types.ObjectId,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return {
    payments: payments.map((p) => ({
      id: p._id.toString(),
      amount: p.amount,
      currency: p.currency,
      status: p.status as PaymentStatus,
      paymentMethod: p.paymentMethod as PaymentMethod,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

/**
 * Create a mock payment for the barbershop's current subscription. Only available in development.
 */
export async function createMockPayment(
  barbershopId: string,
  isDev: boolean
): Promise<PaymentListItem> {
  if (!isDev) {
    throw new ForbiddenError('Mock payments are only available in development.');
  }

  const barbershop = await Barbershop.findById(barbershopId);
  if (!barbershop) {
    throw new NotFoundError('Barbearia não encontrada.');
  }

  const subscriptionId = barbershop.currentSubscriptionId;
  if (!subscriptionId) {
    throw new BadRequestError('Sua barbearia não possui assinatura.');
  }

  const subscription = await Subscription.findById(subscriptionId)
    .populate('planId')
    .lean()
    .exec();
  if (!subscription) {
    throw new NotFoundError('Assinatura não encontrada.');
  }

  const plan = subscription.planId as unknown as { priceMonthly: number } | null;
  const amount = plan?.priceMonthly ?? 0;

  const payment = await Payment.create({
    barbershopId: new mongoose.Types.ObjectId(barbershopId),
    subscriptionId,
    amount,
    currency: 'BRL',
    status: 'paid',
    paymentMethod: 'card',
    paidAt: new Date(),
  });

  return {
    id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status as PaymentStatus,
    paymentMethod: payment.paymentMethod as PaymentMethod,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
  };
}
