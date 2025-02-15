import { readFileSync } from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import { TemplateData } from '../types/template.types';
import { PATHS } from '../config/constants';
import { handleTemplateError } from '../utils/error.handler';

export class NotificationTemplateService {
  private static readonly TEMPLATE_DIR = path.join(__dirname, '..', PATHS.TEMPLATES.NOTIFICATION);
  private static templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  private static loadTemplate(name: string): Handlebars.TemplateDelegate {
    try {
      if (this.templates.has(name)) {
        return this.templates.get(name)!;
      }

      const templatePath = path.join(this.TEMPLATE_DIR, `${name}.hbs`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);
      this.templates.set(name, template);
      return template;
    } catch (error) {
      throw handleTemplateError(error, name);
    }
  }

  static renderTemplate(templateName: string, data: TemplateData): string {
    try {
      const template = this.loadTemplate(templateName);
      return template(data);
    } catch (error) {
      console.error(`Template rendering error: ${error}`);
      return this.getFallbackTemplate(templateName, data);
    }
  }

  private static getFallbackTemplate(templateName: string, data: TemplateData): string {
    switch (templateName) {
      case 'performance-alert':
        return `
          Performance Alert
          Type: ${data.type}
          Message: ${data.message}
          Value: ${data.value}
          Threshold: ${data.threshold}
          Time: ${new Date(data.timestamp).toLocaleString()}
        `;
      default:
        return JSON.stringify(data, null, 2);
    }
  }
}
