import { Request, Response } from 'express';
import { ProductBulkService } from '../services/product.bulk.service';
import { UploadedFile } from 'express-fileupload';

export const importProducts = async (req: Request, res: Response) => {
  try {
    if (!req.files?.products || Array.isArray(req.files.products)) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const file = req.files.products as UploadedFile;
    if (file.mimetype !== 'text/csv') {
      return res.status(400).json({ message: 'File must be a CSV' });
    }

    const results = await ProductBulkService.importProducts(file.data);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const exportProducts = async (req: Request, res: Response) => {
  try {
    const csv = await ProductBulkService.exportProducts();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export products' });
  }
};

export const bulkUpdatePrices = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    await ProductBulkService.bulkUpdatePrices(updates);
    res.json({ message: 'Prices updated successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update prices' });
  }
};
