import { Request, Response, NextFunction } from 'express';
import * as Handlebars from 'handlebars';
import { TemplateError } from '../utils/error.handler';

export const validateTemplate = (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;

  if (!content) {
    throw new TemplateError('Template content is required', 'TEMPLATE_CONTENT_REQUIRED');
  }

  try {
    // Attempt to compile template to validate syntax
    Handlebars.compile(content);
    next();
  } catch (error) {
    throw new TemplateError(`Invalid template syntax: ${error}`, 'TEMPLATE_SYNTAX_ERROR');
  }
};

export const validateTemplateVariables = (req: Request, res: Response, next: NextFunction) => {
  const { variables } = req.body;

  if (variables && !Array.isArray(variables)) {
    throw new TemplateError('Variables must be an array', 'INVALID_VARIABLES_FORMAT');
  }

  next();
};
