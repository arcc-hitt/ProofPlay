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

const FederatedSchema = new Schema<IFederatedIdentity>({
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
});

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  federated: { type: [FederatedSchema], default: [] },
});

export default model<IUser>('User', UserSchema);
