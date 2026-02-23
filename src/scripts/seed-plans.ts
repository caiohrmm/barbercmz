/**
 * Seed dos 3 planos do negócio.
 * Execute: npm run seed:plans (ou npx tsx src/scripts/seed-plans.ts)
 *
 * - Básico: R$ 40/mês, 1 barbeiro
 * - Crescimento: R$ 60/mês, 2 a 5 barbeiros
 * - Equipe: R$ 80/mês, 5+ barbeiros
 *
 * Novas barbearias com plano recebem 30 dias grátis (trial) — ver barbershop.service.
 */

import '../config/env'; // load dotenv
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Plan } from '../modules/plans/plan.model';
import logger from '../utils/logger';

const PLANS = [
  {
    name: 'Básico',
    priceMonthly: 40,
    maxBarbers: 1,
    features: [
      '1 barbeiro',
      'Agenda ilimitada',
      'Clientes e serviços',
      '30 dias grátis para testar',
    ],
  },
  {
    name: 'Crescimento',
    priceMonthly: 60,
    maxBarbers: 5,
    features: [
      'Até 5 barbeiros',
      'Agenda ilimitada',
      'Clientes e serviços',
      '30 dias grátis para testar',
    ],
  },
  {
    name: 'Equipe',
    priceMonthly: 80,
    maxBarbers: 99,
    features: [
      '5+ barbeiros (ilimitado na prática)',
      'Agenda ilimitada',
      'Clientes e serviços',
      '30 dias grátis para testar',
    ],
  },
] as const;

async function seedPlans(): Promise<void> {
  await connectDatabase();

  for (const plan of PLANS) {
    const updated = await Plan.findOneAndUpdate(
      { name: plan.name },
      {
        $set: {
          priceMonthly: plan.priceMonthly,
          maxBarbers: plan.maxBarbers,
          features: plan.features,
          active: true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    logger.info({ plan: updated?.name, id: updated?._id }, 'Plan upserted');
  }

  await disconnectDatabase();
  logger.info('Seed plans finished.');
  process.exit(0);
}

seedPlans().catch((err) => {
  logger.error(err, 'Seed plans failed');
  process.exit(1);
});
