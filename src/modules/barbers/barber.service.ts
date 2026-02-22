import { Barber, IWorkingHours } from './barber.model';
import { Barbershop } from '../barbershops/barbershop.model';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface CreateBarberData {
  name: string;
  workingHours?: IWorkingHours[];
  barbershopId: string;
}

export interface UpdateBarberData {
  name?: string;
  workingHours?: IWorkingHours[];
  active?: boolean;
}

export interface BarberResponse {
  id: string;
  name: string;
  workingHours: IWorkingHours[];
  barbershopId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BarberService {
  async create(data: CreateBarberData): Promise<BarberResponse> {
    // Verify barbershop exists
    const barbershop = await Barbershop.findById(data.barbershopId);
    if (!barbershop || !barbershop.active) {
      throw new NotFoundError('Barbershop not found or inactive');
    }

    // Count active barbers for this barbershop
    const activeBarbersCount = await Barber.countDocuments({
      barbershopId: data.barbershopId,
      active: true,
    });

    // Check if limit is reached
    if (activeBarbersCount >= barbershop.maxBarbers) {
      throw new BadRequestError(
        `Maximum number of barbers (${barbershop.maxBarbers}) reached for this barbershop`
      );
    }

    // Create barber
    const barber = new Barber({
      name: data.name,
      workingHours: data.workingHours || [],
      barbershopId: data.barbershopId,
      active: true,
    });

    await barber.save();

    logger.info(
      {
        barberId: barber._id,
        barbershopId: data.barbershopId,
        name: barber.name,
      },
      'Barber created successfully'
    );

    return {
      id: barber._id.toString(),
      name: barber.name,
      workingHours: barber.workingHours,
      barbershopId: barber.barbershopId.toString(),
      active: barber.active,
      createdAt: barber.createdAt,
      updatedAt: barber.updatedAt,
    };
  }

  async findAll(barbershopId: string, activeOnly?: boolean): Promise<BarberResponse[]> {
    const filter: { barbershopId: string; active?: boolean } = {
      barbershopId,
    };

    if (activeOnly !== undefined) {
      filter.active = activeOnly;
    }

    const barbers = await Barber.find(filter).sort({ name: 1 });

    return barbers.map((barber) => ({
      id: barber._id.toString(),
      name: barber.name,
      workingHours: barber.workingHours,
      barbershopId: barber.barbershopId.toString(),
      active: barber.active,
      createdAt: barber.createdAt,
      updatedAt: barber.updatedAt,
    }));
  }

  async findById(id: string, barbershopId: string): Promise<BarberResponse> {
    const barber = await Barber.findOne({
      _id: id,
      barbershopId,
    });

    if (!barber) {
      throw new NotFoundError('Barber not found');
    }

    return {
      id: barber._id.toString(),
      name: barber.name,
      workingHours: barber.workingHours,
      barbershopId: barber.barbershopId.toString(),
      active: barber.active,
      createdAt: barber.createdAt,
      updatedAt: barber.updatedAt,
    };
  }

  async update(id: string, barbershopId: string, data: UpdateBarberData): Promise<BarberResponse> {
    const barber = await Barber.findOne({
      _id: id,
      barbershopId,
    });

    if (!barber) {
      throw new NotFoundError('Barber not found');
    }

    // Update fields
    if (data.name !== undefined) {
      barber.name = data.name;
    }

    if (data.workingHours !== undefined) {
      barber.workingHours = data.workingHours;
    }

    if (data.active !== undefined) {
      // If activating, check barber limit
      if (data.active && !barber.active) {
        const barbershop = await Barbershop.findById(barbershopId);
        if (barbershop) {
          const activeBarbersCount = await Barber.countDocuments({
            barbershopId,
            active: true,
            _id: { $ne: id },
          });

          if (activeBarbersCount >= barbershop.maxBarbers) {
            throw new BadRequestError(
              `Maximum number of barbers (${barbershop.maxBarbers}) reached for this barbershop`
            );
          }
        }
      }
      barber.active = data.active;
    }

    await barber.save();

    logger.info(
      {
        barberId: barber._id,
        barbershopId,
        updates: data,
      },
      'Barber updated successfully'
    );

    return {
      id: barber._id.toString(),
      name: barber.name,
      workingHours: barber.workingHours,
      barbershopId: barber.barbershopId.toString(),
      active: barber.active,
      createdAt: barber.createdAt,
      updatedAt: barber.updatedAt,
    };
  }

  async delete(id: string, barbershopId: string): Promise<void> {
    const barber = await Barber.findOne({
      _id: id,
      barbershopId,
    });

    if (!barber) {
      throw new NotFoundError('Barber not found');
    }

    // Soft delete - mark as inactive
    barber.active = false;
    await barber.save();

    logger.info(
      {
        barberId: barber._id,
        barbershopId,
      },
      'Barber deleted (soft delete)'
    );
  }
}

export const barberService = new BarberService();

