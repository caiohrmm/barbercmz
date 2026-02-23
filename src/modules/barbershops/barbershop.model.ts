import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBarbershop extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  planId?: Types.ObjectId;
  currentSubscriptionId?: Types.ObjectId;
  maxBarbers: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BarbershopSchema = new Schema<IBarbershop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    currentSubscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    maxBarbers: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
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

export const Barbershop = mongoose.model<IBarbershop>('Barbershop', BarbershopSchema);

