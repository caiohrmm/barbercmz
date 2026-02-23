import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPendingVerification extends Document {
  barbershopId: Types.ObjectId;
  barberId: Types.ObjectId;
  serviceId: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  code: string; // 6-digit string
  expiresAt: Date;
  createdAt: Date;
}

const PendingVerificationSchema = new Schema<IPendingVerification>(
  {
    barbershopId: {
      type: Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: true,
      index: true,
    },
    barberId: {
      type: Schema.Types.ObjectId,
      ref: 'Barber',
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    code: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL-like: allow finding by id and code; cleanup can be a cron later
PendingVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL - delete when expiresAt is past

export const PendingVerification = mongoose.model<IPendingVerification>(
  'PendingVerification',
  PendingVerificationSchema
);
