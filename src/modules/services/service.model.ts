import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IService extends Document {
  name: string;
  duration: number; // in minutes
  price: number;
  barbershopId: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    barbershopId: {
      type: Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for multi-tenant queries
ServiceSchema.index({ barbershopId: 1, active: 1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema);

