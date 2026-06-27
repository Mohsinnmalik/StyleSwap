import mongoose, { Schema, models, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'owner';
  shop_id: Types.ObjectId;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['owner'], default: 'owner' },
  shop_id:    { type: Schema.Types.ObjectId, ref: 'Shop' },
  created_at: { type: Date, default: Date.now },
});

export const User = models.User || model<IUser>('User', UserSchema);
