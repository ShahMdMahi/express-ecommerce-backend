import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError, BadRequestError } from '../utils/ApiError';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.types';

class ProductControllerClass {
    createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productData: CreateProductDTO = req.body;
            const product = await ProductService.createProduct(productData);
            res.status(201).json(ApiResponse.created(product));
        } catch (error) {
            next(error);
        }
    };

    getProducts = async (req: Request, res: Response, next: NextFunction) => {
        // Implementation
    };

    getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
        // Implementation
    };

    getProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.getProduct(req.params.id);
            if (!product) {
                throw new BadRequestError('Product not found');
            }
            res.json(ApiResponse.success(product));
        } catch (error) {
            next(error);
        }
    };

    updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updateData: UpdateProductDTO = req.body;
            const product = await ProductService.updateProduct(req.params.id, updateData);
            if (!product) {
                throw new BadRequestError('Product not found');
            }
            res.json(ApiResponse.success(product));
        } catch (error) {
            next(error);
        }
    };

    deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await ProductService.deleteProduct(req.params.id);
            if (!result) {
                throw new BadRequestError('Product not found');
            }
            res.json(ApiResponse.success({ deleted: true }));
        } catch (error) {
            next(error);
        }
    };

    updateStock = async (req: Request, res: Response, next: NextFunction) => {
        // Implementation
    };

    searchProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { query = {}, page = 1, limit = 10 } = req.query;
            const results = await ProductService.searchProducts(
                query as any,
                Number(page),
                Number(limit)
            );
            res.json(ApiResponse.success(results));
        } catch (error) {
            next(error);
        }
    };

    checkLowStock = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const products = await ProductService.checkLowStock();
            res.json(ApiResponse.success(products));
        } catch (error) {
            next(error);
        }
    };
}

export const ProductController = new ProductControllerClass();
export const {
    createProduct,
    getProducts,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    updateStock,
    searchProducts,
    checkLowStock
} = ProductController;
