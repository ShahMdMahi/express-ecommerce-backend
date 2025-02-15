import mongoose, { Document, Schema } from 'mongoose';
import { generateSlug } from '../utils/slug.util';
import { IProduct as IProductType } from '../types/product.types';

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

const productVariantSchema = new Schema({
    sku: { type: String, required: true, unique: true },
    attributes: { type: Map, of: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
    images: [String]
});

const productSchema = new Schema<IProduct>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    basePrice: { type: Number, required: true },
    images: [String],
    variants: [productVariantSchema],
    tags: [String],
    brand: String,
    isActive: { type: Boolean, default: true },
    stock: {
        quantity: { type: Number, required: true, min: 0 },
        lowStockThreshold: { type: Number, default: 10 },
        sku: { type: String, required: true, unique: true }
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    sustainability: {
        score: { type: Number, default: 0 },
        certifications: [String],
        recyclable: { type: Boolean, default: false },
        carbonFootprint: Number
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Pre-save hook for slug generation
productSchema.pre('save', async function(next) {
    if (this.isModified('name')) {
        this.slug = await generateSlug(this.name);
    }
    next();
});

// Indexes
productSchema.index({ 
    name: 'text', 
    description: 'text', 
    tags: 'text',
    'seo.keywords': 'text' 
});

productSchema.index({ 'stock.quantity': 1, 'stock.lowStockThreshold': 1 });
productSchema.index({ 'variants.stock': 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
