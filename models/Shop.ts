import { Schema, models, model, Document, Types } from 'mongoose';

export interface IShop extends Document {
  _id: Types.ObjectId;
  owner_id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  created_at: Date;
}

const ShopSchema = new Schema<IShop>({
  owner_id:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  logo_url:    { type: String, default: '' },
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now },
});

export const Shop = models.Shop || model<IShop>('Shop', ShopSchema);
