import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as Handlebars from 'handlebars';
import redisClient from '../config/redis.config';
import { TemplateCustomization } from '../types/template.types';
import { MustacheStatement, Program, BlockStatement, Node } from '../types/handlebars.types';
import { CACHE, PATHS } from '../config/constants';

export class TemplateCustomizationService {
  private static readonly CACHE_PREFIX = CACHE.TEMPLATE.PREFIX;
  private static readonly TEMPLATE_DIR = path.join(__dirname, '..', PATHS.TEMPLATES.CUSTOM);

  static async saveTemplate(customization: Partial<TemplateCustomization>): Promise<TemplateCustomization> {
    const id = customization.id || Date.now().toString();
    const template: TemplateCustomization = {
      id,
      name: customization.name || 'Untitled',
      content: customization.content || '',
      variables: this.extractVariables(customization.content || ''),
      version: (customization.version || 0) + 1,
      lastModified: new Date()
    };

    // Save to filesystem
    const filePath = path.join(this.TEMPLATE_DIR, `${id}.hbs`);
    writeFileSync(filePath, template.content);

    // Cache template
    await redisClient.setEx(
      `${this.CACHE_PREFIX}${id}`,
      3600,
      JSON.stringify(template)
    );

    return template;
  }

  static async getTemplate(id: string): Promise<TemplateCustomization | null> {
    // Try cache first
    const cached = await redisClient.get(`${this.CACHE_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Load from filesystem
    try {
      const filePath = path.join(this.TEMPLATE_DIR, `${id}.hbs`);
      const content = readFileSync(filePath, 'utf-8');
      
      const template: TemplateCustomization = {
        id,
        name: id,
        content,
        variables: this.extractVariables(content),
        version: 1,
        lastModified: new Date()
      };

      // Cache for future use
      await redisClient.setEx(
        `${this.CACHE_PREFIX}${id}`,
        3600,
        JSON.stringify(template)
      );

      return template;
    } catch (error) {
      console.error(`Template ${id} not found:`, error);
      return null;
    }
  }

  private static extractVariables(content: string): string[] {
    const ast = Handlebars.parse(content);
    const variables = new Set<string>();

    function traverse(node: Node) {
      if (node.type === 'MustacheStatement') {
        const mustacheNode = node as MustacheStatement;
        if (mustacheNode.path && mustacheNode.path.original) {
          variables.add(mustacheNode.path.original);
        }
      }
      
      if ((node as Program).body) {
        (node as Program).body.forEach(traverse);
      }
      
      if ((node as BlockStatement).program) {
        traverse((node as BlockStatement).program);
      }
    }

    traverse(ast as Node);
    return Array.from(variables);
  }

  static precompileTemplate(content: string): HandlebarsTemplateDelegate {
    return Handlebars.compile(content);
  }
}
