import { Plan } from './plan.model';

export interface PlanResponse {
  id: string;
  name: string;
  priceMonthly: number;
  maxBarbers: number;
  features: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PlanService {
  async findAllActive(): Promise<PlanResponse[]> {
    const plans = await Plan.find({ active: true }).sort({ priceMonthly: 1 });

    return plans.map((plan) => ({
      id: plan._id.toString(),
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      maxBarbers: plan.maxBarbers,
      features: plan.features ?? [],
      active: plan.active,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  }
}

export const planService = new PlanService();
