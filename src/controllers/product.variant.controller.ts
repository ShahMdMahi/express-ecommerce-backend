import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import { VariantService } from '../services/variant.service';
import { ImageService } from '../services/image.service';
import { FileArray, UploadedFile } from 'express-fileupload';

export const addVariant = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { sku, attributes, price, stock } = req.body;
    
    // Handle file upload with proper typing
    let imageUrls: string[] = [];
    if (req.files && 'images' in req.files) {
      const imageFiles: FileArray = {
        images: req.files.images
      };
      imageUrls = await ImageService.uploadMultiple(imageFiles, `products/${productId}/variants`);
    }

    const variant = await VariantService.addVariant(productId, {
      sku,
      attributes,
      price,
      stock,
      images: imageUrls
    });

    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateVariant = async (req: Request, res: Response) => {
  try {
    const { productId, sku } = req.params;
    const variant = await VariantService.updateVariant(productId, sku, req.body);
    res.json(variant);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    const { productId, sku } = req.params;
    await VariantService.deleteVariant(productId, sku);
    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
