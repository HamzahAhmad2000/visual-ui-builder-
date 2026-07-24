import type { BuilderDocument } from '../builder';
import type { ContentComposerCase } from '../profiles/profiles';
import type { VisualUiBuilderTheme } from '../theme/tokens';

export const VISUAL_TEMPLATE_SCHEMA_VERSION = 1;

export type VisualTemplateKind = 'component' | 'template';
export type VisualTemplateStatus = 'draft' | 'published' | 'archived';

export interface VisualTemplateRecord {
  id: string;
  name: string;
  scope: ContentComposerCase;
  kind: VisualTemplateKind;
  status: VisualTemplateStatus;
  html: string;
  plainText: string;
  document: BuilderDocument;
  theme: Partial<VisualUiBuilderTheme>;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface VisualTemplateInput {
  id?: string;
  name: string;
  scope: ContentComposerCase;
  kind?: VisualTemplateKind;
  status?: VisualTemplateStatus;
  html?: string;
  plainText?: string;
  document?: BuilderDocument;
  theme?: Partial<VisualUiBuilderTheme>;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface VisualTemplateListFilter {
  scope?: ContentComposerCase | 'all';
  kind?: VisualTemplateKind | 'all';
  status?: VisualTemplateStatus | 'all';
  query?: string;
}

export interface VisualTemplateStore {
  list: (filter?: VisualTemplateListFilter) => Promise<VisualTemplateRecord[]>;
  get: (id: string) => Promise<VisualTemplateRecord | null>;
  save: (input: VisualTemplateInput) => Promise<VisualTemplateRecord>;
  delete: (id: string) => Promise<void>;
  duplicate: (id: string, name?: string) => Promise<VisualTemplateRecord>;
}
