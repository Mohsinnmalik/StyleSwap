import { Schema, models, model, Document, Types } from 'mongoose';

export type SessionStatus = 'processing' | 'done' | 'expired';
export type ClothSourceType = 'catalogue' | 'upload';

export interface ITryonSession extends Document {
  _id: Types.ObjectId;
  session_code: string;
  shop_id: Types.ObjectId;
  person_image: { url: string; public_id: string };
  cloth_source: {
    type: ClothSourceType;
    product_id?: Types.ObjectId;
    image_url: string;
    public_id?: string;
  };
  status: SessionStatus;
  result_image_url: string | null;
  created_at: Date;
  expires_at: Date;
}

const TryonSessionSchema = new Schema<ITryonSession>({
  session_code: { type: String, required: true, unique: true, index: true },
  shop_id:      { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  person_image: {
    url:       { type: String, required: true },
    public_id: { type: String, required: true },
  },
  cloth_source: {
    type:       { type: String, enum: ['catalogue', 'upload'], required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    image_url:  { type: String, required: true },
    public_id:  { type: String, default: null },
  },
  status:           { type: String, enum: ['processing', 'done', 'expired'], default: 'processing' },
  result_image_url: { type: String, default: null },
  created_at:       { type: Date, default: Date.now },
  expires_at:       { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) },
});

// TTL index: MongoDB auto-deletes documents 0 seconds after expires_at
TryonSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const TryonSession = models.TryonSession || model<ITryonSession>('TryonSession', TryonSessionSchema);
