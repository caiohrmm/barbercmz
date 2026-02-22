import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'barber';
  barbershopId: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'barber'],
      required: true,
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

// Index for email (already defined above, but explicit for clarity)
UserSchema.index({ email: 1 }, { unique: true });
// Index for multi-tenant queries
UserSchema.index({ barbershopId: 1, active: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

