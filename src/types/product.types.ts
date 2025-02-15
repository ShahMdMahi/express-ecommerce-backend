export interface IProductVariant {
    id: string;
    sku: string;
    color?: string;
    size?: string;
    weight?: number;
    stock: number;
    price: number;
    images: string[];
}

export interface IProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    subcategory?: string;
    brand: string;
    variants: IProductVariant[];
    tags: string[];
    rating: number;
    reviews: number;
    sustainability: {
        score: number;
        recyclable: boolean;
        carbonFootprint: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export type CreateProductDTO = Omit<IProduct, 'id' | 'rating' | 'reviews' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
