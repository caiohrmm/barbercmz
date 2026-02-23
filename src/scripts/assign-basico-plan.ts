/**
 * Atribui o plano "Básico" a todas as barbearias que ainda não têm plano (planId null).
 * Execute DEPOIS do seed:plans.
 * Uso: npm run assign:basico
 */

import '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Barbershop } from '../modules/barbershops/barbershop.model';
import { Plan } from '../modules/plans/plan.model';
import logger from '../utils/logger';

async function assignBasicoPlan(): Promise<void> {
  await connectDatabase();

  const basico = await Plan.findOne({ name: 'Básico', active: true });
  if (!basico) {
    logger.error('Plan "Básico" not found. Run npm run seed:plans first.');
    await disconnectDatabase();
    process.exit(1);
  }

  const gratuito = await Plan.findOne({ name: 'Gratuito' }).lean();

  const result = await Barbershop.updateMany(
    {
      $or: [
        { planId: { $exists: false } },
        { planId: null },
        ...(gratuito ? [{ planId: gratuito._id }] : []),
      ],
    },
    { $set: { planId: basico._id, maxBarbers: basico.maxBarbers } }
  );

  logger.info(
    { matched: result.matchedCount, modified: result.modifiedCount },
    'Barbershops updated with Básico plan'
  );

  await disconnectDatabase();
  process.exit(0);
}

assignBasicoPlan().catch((err) => {
  logger.error(err, 'assign-basico-plan failed');
  process.exit(1);
});
