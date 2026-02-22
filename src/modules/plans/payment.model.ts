import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  barbershopId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'pix' | 'card' | 'boleto';
  externalPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    barbershopId: {
      type: Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'BRL',
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      required: true,
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['pix', 'card', 'boleto'],
      required: true,
    },
    externalPaymentId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentSchema.index({ barbershopId: 1, status: 1 });
PaymentSchema.index({ subscriptionId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

