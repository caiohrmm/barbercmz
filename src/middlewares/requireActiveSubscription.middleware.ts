import { Response, NextFunction } from 'express';
import { Barbershop } from '../modules/barbershops/barbershop.model';
import { Subscription } from '../modules/plans/subscription.model';
import { AuthRequest } from './auth.middleware';
import { refreshTrialExpiry } from '../modules/subscriptions/subscription.service';

const ACTIVE_STATUSES = ['active', 'trial'] as const;

/**
 * Blocks access if the barbershop has no subscription or subscription is suspended/cancelled.
 * Refreshes trial expiry (trial -> suspended) before checking.
 */
export function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
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

      const subscriptionId = barbershop.currentSubscriptionId;
      if (!subscriptionId) {
        res.status(403).json({
          error: 'SubscriptionRequired',
          message: 'Sua barbearia não possui assinatura ativa. Escolha um plano para continuar.',
        });
        return;
      }

      await refreshTrialExpiry(subscriptionId as import('mongoose').Types.ObjectId);

      const subscription = await Subscription.findById(subscriptionId).lean().exec();
      if (!subscription) {
        res.status(403).json({
          error: 'SubscriptionRequired',
          message: 'Assinatura não encontrada. Escolha um plano para continuar.',
        });
        return;
      }

      const isActive = ACTIVE_STATUSES.includes(
        subscription.status as (typeof ACTIVE_STATUSES)[number]
      );
      if (!isActive) {
        res.status(403).json({
          error: 'SubscriptionExpired',
          message: 'Sua assinatura está suspensa ou expirada. Escolha um plano para reativar.',
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  })();
}
