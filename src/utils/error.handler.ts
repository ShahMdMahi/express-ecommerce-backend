export class TemplateError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export function handleTemplateError(error: unknown, templateId?: string): never {
  if (error instanceof TemplateError) {
    throw error;
  }
  throw new TemplateError(
    `Template operation failed${templateId ? ` for ${templateId}` : ''}: ${String(error)}`,
    'TEMPLATE_ERROR'
  );
}
