import { Request, Response } from 'express';
import { planService } from './plan.service';

export class PlanController {
  async list(_req: Request, res: Response): Promise<void> {
    const plans = await planService.findAllActive();
    res.status(200).json(plans);
  }
}

export const planController = new PlanController();
