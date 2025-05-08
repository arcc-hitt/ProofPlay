// Description: User model for MongoDB
import { Schema, model, Document } from 'mongoose';

export interface IFederatedIdentity {
  provider: 'google' | 'github';
  providerId: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;              // for local users
  federated?: IFederatedIdentity[];   // for social logins
}

const FederatedSchema = new Schema<IFederatedIdentity>(
  {
    provider: { type: String, required: true, enum: ['google', 'github'] },
    providerId: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    federated: { type: [FederatedSchema], default: [] },
  },
  { timestamps: true }
);

export default model<IUser>('User', UserSchema);
