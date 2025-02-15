import express from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { validateTemplate, validateTemplateVariables } from '../middleware/template.validation';
import { saveTemplate, getTemplate } from '../controllers/template.controller';
import { handleTemplateError } from '../utils/error.handler';

const router = express.Router();

router.use(protect, admin);

router.post('/', 
  validateTemplate, 
  validateTemplateVariables, 
  handleAsyncErrors(saveTemplate)
);

router.get('/:id', handleAsyncErrors(getTemplate));

function handleAsyncErrors(fn: Function) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      handleTemplateError(error);
    }
  };
}

export default router;
