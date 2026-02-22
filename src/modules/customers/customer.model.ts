import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  noShowCount: number;
  blocked: boolean;
  barbershopId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^\+?[1-9]\d{1,14}$/, // E.164 format
    },
    noShowCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    barbershopId: {
      type: Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for multi-tenant queries and phone uniqueness per barbershop
CustomerSchema.index({ barbershopId: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

