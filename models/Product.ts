import { Schema, models, model, Document, Types } from 'mongoose';

export type ProductCategory = 'shirt' | 'kurta' | 'jacket' | 'trouser' | 'suit' | 'other';

export interface IProductImage {
  url: string;
  public_id: string;
  is_primary: boolean;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  shop_id: Types.ObjectId;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  images: IProductImage[];
  sizes: string[];
  colors: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url:        { type: String, required: true },
  public_id:  { type: String, required: true },
  is_primary: { type: Boolean, default: false },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  shop_id:     { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['shirt','kurta','jacket','trouser','suit','other'], required: true },
  price:       { type: Number, required: true, min: 0 },
  images:      [ProductImageSchema],
  sizes:       [{ type: String }],
  colors:      [{ type: String }],
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now },
});

ProductSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const Product = models.Product || model<IProduct>('Product', ProductSchema);
