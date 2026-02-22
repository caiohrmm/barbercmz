import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  isAvailable: boolean;
}

export interface IBarber extends Document {
  name: string;
  workingHours: IWorkingHours[];
  barbershopId: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema<IWorkingHours>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const BarberSchema = new Schema<IBarber>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    workingHours: {
      type: [WorkingHoursSchema],
      default: [],
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
BarberSchema.index({ barbershopId: 1, active: 1 });

export const Barber = mongoose.model<IBarber>('Barber', BarberSchema);

