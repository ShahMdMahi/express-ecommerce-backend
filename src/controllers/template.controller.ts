import { Request, Response } from 'express';
import { TemplateCustomizationService } from '../services/template.customization.service';

export const saveTemplate = async (req: Request, res: Response) => {
  try {
    const template = await TemplateCustomizationService.saveTemplate(req.body);
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save template' });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const template = await TemplateCustomizationService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch template' });
  }
};
