import mongoose, { Document } from 'mongoose';
import { generateSlug } from '../utils/slug.util';

export interface IVariant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images?: string[];
}

export interface IProductBase {
  name: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  basePrice: number;
  images: string[];
  variants: IVariant[];
  tags: string[];
  brand?: string;
  isActive: boolean;
  stock: {
    quantity: number;
    lowStockThreshold: number;
    sku: string;
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  sustainability?: {
    score: number;
    certifications: string[];
    recyclable: boolean;
    carbonFootprint?: number;
  };
  rating: {
    average: number;
    count: number;
  };
}

export interface IProduct extends IProductBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProductBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice: { type: Number, required: true },
  images: [{ type: String }],
  variants: [{
    sku: { type: String, required: true },
    attributes: { type: Map, of: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: [{ type: String }]
  }],
  tags: [{ type: String }],
  brand: String,
  isActive: { type: Boolean, default: true },
  stock: {
    quantity: { type: Number, required: true },
    lowStockThreshold: { type: Number, default: 10 },
    sku: { type: String, required: true }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  sustainability: {
    score: { type: Number, min: 0, max: 100 },
    certifications: [String],
    recyclable: Boolean,
    carbonFootprint: Number
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Generate slug before saving
productSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = await generateSlug(this.name);
  }
  next();
});

// Index for search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  'seo.keywords': 'text' 
});

// Stock management indexes
productSchema.index({ 'stock.quantity': 1, 'stock.lowStockThreshold': 1 });
productSchema.index({ 'variants.stock': 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
