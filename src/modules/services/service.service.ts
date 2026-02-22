import { Service } from './service.model';
import { Barbershop } from '../barbershops/barbershop.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface CreateServiceData {
  name: string;
  duration: number;
  price: number;
  barbershopId: string;
}

export interface UpdateServiceData {
  name?: string;
  duration?: number;
  price?: number;
  active?: boolean;
}

export interface ServiceResponse {
  id: string;
  name: string;
  duration: number;
  price: number;
  barbershopId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceService {
  async create(data: CreateServiceData): Promise<ServiceResponse> {
    // Verify barbershop exists
    const barbershop = await Barbershop.findById(data.barbershopId);
    if (!barbershop || !barbershop.active) {
      throw new NotFoundError('Barbershop not found or inactive');
    }

    // Create service
    const service = new Service({
      name: data.name,
      duration: data.duration,
      price: data.price,
      barbershopId: data.barbershopId,
      active: true,
    });

    await service.save();

    logger.info(
      {
        serviceId: service._id,
        barbershopId: data.barbershopId,
        name: service.name,
      },
      'Service created successfully'
    );

    return {
      id: service._id.toString(),
      name: service.name,
      duration: service.duration,
      price: service.price,
      barbershopId: service.barbershopId.toString(),
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  async findAll(barbershopId: string, activeOnly?: boolean): Promise<ServiceResponse[]> {
    const filter: { barbershopId: string; active?: boolean } = {
      barbershopId,
    };

    if (activeOnly !== undefined) {
      filter.active = activeOnly;
    }

    const services = await Service.find(filter).sort({ name: 1 });

    return services.map((service) => ({
      id: service._id.toString(),
      name: service.name,
      duration: service.duration,
      price: service.price,
      barbershopId: service.barbershopId.toString(),
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    }));
  }

  async findById(id: string, barbershopId: string): Promise<ServiceResponse> {
    const service = await Service.findOne({
      _id: id,
      barbershopId,
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    return {
      id: service._id.toString(),
      name: service.name,
      duration: service.duration,
      price: service.price,
      barbershopId: service.barbershopId.toString(),
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  async update(id: string, barbershopId: string, data: UpdateServiceData): Promise<ServiceResponse> {
    const service = await Service.findOne({
      _id: id,
      barbershopId,
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Update fields
    if (data.name !== undefined) {
      service.name = data.name;
    }

    if (data.duration !== undefined) {
      service.duration = data.duration;
    }

    if (data.price !== undefined) {
      service.price = data.price;
    }

    if (data.active !== undefined) {
      service.active = data.active;
    }

    await service.save();

    logger.info(
      {
        serviceId: service._id,
        barbershopId,
        updates: data,
      },
      'Service updated successfully'
    );

    return {
      id: service._id.toString(),
      name: service.name,
      duration: service.duration,
      price: service.price,
      barbershopId: service.barbershopId.toString(),
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  async delete(id: string, barbershopId: string): Promise<void> {
    const service = await Service.findOne({
      _id: id,
      barbershopId,
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Soft delete - mark as inactive
    service.active = false;
    await service.save();

    logger.info(
      {
        serviceId: service._id,
        barbershopId,
      },
      'Service deleted (soft delete)'
    );
  }
}

export const serviceService = new ServiceService();

