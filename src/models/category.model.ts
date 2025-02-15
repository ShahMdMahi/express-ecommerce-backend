import mongoose, { Document, Schema } from 'mongoose';
import { generateSlug } from '../utils/slug.util';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    parent?: mongoose.Types.ObjectId;
    image?: string;
    isActive: boolean;
    level: number;
    metadata?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
}

export type ICategoryDocument = ICategory & Document;

const categorySchema = new Schema<ICategory>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    parent: { type: Schema.Types.ObjectId, ref: 'Category' },
    image: String,
    isActive: { type: Boolean, default: true },
    level: { type: Number, default: 0 },
    metadata: {
        title: String,
        description: String,
        keywords: [String]
    }
}, {
    timestamps: true
});

categorySchema.pre('save', async function(next) {
    if (this.isModified('name')) {
        this.slug = await generateSlug(this.name);
    }
    next();
});

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ name: 'text', 'metadata.keywords': 'text' });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
