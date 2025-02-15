import { MustacheStatement, PathExpression } from './handlebars.types';

export interface TemplateCustomization {
  id: string;
  name: string;
  content: string;
  variables: string[];
  version: number;
  lastModified: Date;
}

export type TemplateResponse = TemplateCustomization | null;

export interface TemplateData {
  [key: string]: any;
}

export interface HandlebarsASTNodes {
  MustacheNode: MustacheStatement & {
    path: PathExpression;
  };
}
