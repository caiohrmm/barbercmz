import { Customer } from './customer.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface CustomerResponse {
  id: string;
  name: string;
  phone: string;
  noShowCount: number;
  blocked: boolean;
  barbershopId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerService {
  async findAll(barbershopId: string, filters?: {
    blocked?: boolean;
    search?: string;
  }): Promise<CustomerResponse[]> {
    const query: any = {
      barbershopId,
    };

    if (filters?.blocked !== undefined) {
      query.blocked = filters.blocked;
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
      ];
    }

    const customers = await Customer.find(query).sort({ name: 1 });

    return customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      noShowCount: customer.noShowCount,
      blocked: customer.blocked,
      barbershopId: customer.barbershopId.toString(),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));
  }

  async findById(id: string, barbershopId: string): Promise<CustomerResponse> {
    const customer = await Customer.findOne({
      _id: id,
      barbershopId,
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      noShowCount: customer.noShowCount,
      blocked: customer.blocked,
      barbershopId: customer.barbershopId.toString(),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async block(id: string, barbershopId: string, blocked: boolean): Promise<CustomerResponse> {
    const customer = await Customer.findOne({
      _id: id,
      barbershopId,
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    customer.blocked = blocked;
    await customer.save();

    logger.info(
      {
        customerId: customer._id,
        barbershopId,
        blocked,
      },
      `Customer ${blocked ? 'blocked' : 'unblocked'} successfully`
    );

    return {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      noShowCount: customer.noShowCount,
      blocked: customer.blocked,
      barbershopId: customer.barbershopId.toString(),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

export const customerService = new CustomerService();

