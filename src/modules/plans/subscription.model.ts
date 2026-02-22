import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  barbershopId: Types.ObjectId;
  planId: Types.ObjectId;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  externalSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    barbershopId: {
      type: Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'trial'],
      required: true,
      default: 'trial',
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialEndsAt: {
      type: Date,
    },
    externalSubscriptionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SubscriptionSchema.index({ barbershopId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

