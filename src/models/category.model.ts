import mongoose, { Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  image?: string;
  isActive: boolean;
  level: number;
}

export interface ICategoryDocument extends ICategory, Document {
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  level: { type: Number, default: 1 }
}, {
  timestamps: true
});

categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);
