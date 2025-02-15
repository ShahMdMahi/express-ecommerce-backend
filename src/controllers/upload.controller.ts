import { Request, Response } from 'express';
import { ImageService } from '../services/image.service';
import { UploadedFile } from 'express-fileupload';

export const uploadImages = async (req: Request, res: Response) => {
  try {
    const { folder = 'general' } = req.body;
    const urls = await ImageService.uploadMultiple(req.files!, folder);
    res.json({ urls });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const uploadSingleFile = async (req: Request, res: Response) => {
  try {
    if (!req.files?.image) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.image as UploadedFile;
    const { folder = 'general' } = req.body;

    const url = await ImageService.uploadSingle(file, folder);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
