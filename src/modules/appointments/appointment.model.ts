import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppointment extends Document {
  barbershopId: Types.ObjectId;
  barberId: Types.ObjectId;
  serviceId: Types.ObjectId;
  customerId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
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
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      required: true,
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries (as specified in requirements)
AppointmentSchema.index({ barbershopId: 1, barberId: 1, startTime: 1 });
// Index for customer appointments
AppointmentSchema.index({ barbershopId: 1, customerId: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);

