import {
  blocksToPlainText,
  createBlock,
  createBaseProperties,
  parseDocumentFromHtml,
  renderBlocksToHtml,
  serializeBlocksToHtml,
  type BaseProperties,
  type BuilderBlock,
  type BuilderBlockType,
  type BuilderDocument,
  type RenderOptions,
} from '../builder';

export type ContentComposerCase =
  | 'email-template'
  | 'survey'
  | 'docs'
  | 'announcement'
  | 'popup-news';

export type ContentComposerMode = 'blocks' | 'survey-questions' | 'docs-rich-blocks';

export interface ContentComposerFeature {
  key: string;
  label: string;
}

export interface ContentComposerProfile {
  id: ContentComposerCase;
  label: string;
  mode: ContentComposerMode;
  canvasLabel: string;
  emptyTitle: string;
  emptyHint: string;
  serialize: Pick<RenderOptions, 'wrap'>;
  defaultBlocks: () => BuilderBlock[];
  allowedBlocks: BuilderBlockType[];
  features: ContentComposerFeature[];
}

export interface SerializedComposerOutput {
  html: string;
  plainText: string;
}

export const DEFAULT_ALLOWED_BLOCKS: BuilderBlockType[] = [
  'heading',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'html',
  'social_icon',
  'layout_row',
];

export const createDefaultEmailTemplateBlocks = (): BuilderBlock[] => [
  createBlock('heading', { text: 'Delivery Update', level: 2 }),
  createBlock('text', {
    html: '<p>Hello {{user.first_name}}, your order {{order.number}} has been updated.</p>',
  }),
  createBlock('button', {
    text: 'View Tracking',
    url: '{{links.tracking}}',
    backgroundColor: '#111827',
  }),
];

export const createDefaultDocsBlocks = (): BuilderBlock[] => [
  createBlock('heading', { text: 'Section heading', level: 2 }),
  createBlock('text', { html: '<p>Write the reusable documentation content here.</p>' }),
];

export const createDefaultAnnouncementBlocks = (): BuilderBlock[] => [
  createBlock('text', { html: '<p>Add announcement copy here.</p>' }),
];

export const createDefaultPopupNewsBlocks = (): BuilderBlock[] => [
  createBlock('heading', { text: 'What is new', level: 2, align: 'center' }),
  createBlock('text', { html: '<p>Add pop-up news content here.</p>' }),
  createBlock('button', { text: 'Learn more', url: '' }),
];

export const createDefaultSurveyIntroBlocks = (): BuilderBlock[] => [
  createBlock('heading', { text: 'Survey title', level: 2 }),
  createBlock('text', { html: '<p>Use questions to collect structured responses.</p>' }),
];

export const CONTENT_COMPOSER_PROFILES: Record<ContentComposerCase, ContentComposerProfile> = {
  'email-template': {
    id: 'email-template',
    label: 'Email Template Builder',
    mode: 'blocks',
    canvasLabel: 'Email Preview',
    emptyTitle: 'Email body',
    emptyHint: 'Drag and drop elements here to build your email template',
    serialize: { wrap: true },
    defaultBlocks: createDefaultEmailTemplateBlocks,
    allowedBlocks: DEFAULT_ALLOWED_BLOCKS,
    features: [
      { key: 'email-safe-html', label: 'Inline email-safe HTML rendering' },
      { key: 'responsive-style-layers', label: 'Desktop and mobile style layers' },
      { key: 'merge-variables', label: 'Merge variables and sample payload preview' },
      { key: 'attachments', label: 'Image and file attachment workflow' },
      { key: 'starter-templates', label: 'Starter template hydration' },
    ],
  },
  survey: {
    id: 'survey',
    label: 'Survey Builder',
    mode: 'survey-questions',
    canvasLabel: 'Survey Preview',
    emptyTitle: 'Survey',
    emptyHint: 'Add questions to build the survey response surface',
    serialize: { wrap: false },
    defaultBlocks: createDefaultSurveyIntroBlocks,
    allowedBlocks: [],
    features: [
      { key: 'question-palette', label: 'Opinionated question-type palette' },
      { key: 'question-reorder', label: 'Drag-to-reorder question flow' },
      { key: 'audience-controls', label: 'Global, role-specific, public, and tenant audience controls' },
      { key: 'completion-policy', label: 'Required and published state controls' },
      { key: 'response-preview', label: 'Preview that mirrors the response surface' },
    ],
  },
  docs: {
    id: 'docs',
    label: 'Documentation Builder',
    mode: 'docs-rich-blocks',
    canvasLabel: 'Documentation Content',
    emptyTitle: 'Documentation content',
    emptyHint: 'Compose reusable documentation sections with rich blocks',
    serialize: { wrap: true },
    defaultBlocks: createDefaultDocsBlocks,
    allowedBlocks: DEFAULT_ALLOWED_BLOCKS,
    features: [
      { key: 'rich-block-modal', label: 'Full-screen rich content modal' },
      { key: 'structured-doc-blocks', label: 'Markdown, code, table, callout, and rich blocks' },
      { key: 'metadata', label: 'Slug, status, visibility, version, tags, and featured metadata' },
      { key: 'permissions', label: 'Per-doc view, edit, and publish permissions' },
      { key: 'json-export', label: 'Seed-ready JSON export' },
    ],
  },
  announcement: {
    id: 'announcement',
    label: 'Announcement Builder',
    mode: 'blocks',
    canvasLabel: 'Announcement Preview',
    emptyTitle: 'Announcement content',
    emptyHint: 'Drag elements here to build the announcement body',
    serialize: { wrap: false },
    defaultBlocks: createDefaultAnnouncementBlocks,
    allowedBlocks: DEFAULT_ALLOWED_BLOCKS,
    features: [
      { key: 'sidebar-top-banner', label: 'Sidebar and top-banner preview modes' },
      { key: 'role-audience', label: 'Global and role-targeted delivery' },
      { key: 'display-order', label: 'Sibling display-order resequencing' },
      { key: 'publish-flow', label: 'Draft save and publish actions' },
      { key: 'visual-chrome', label: 'Background, image, CTA, and close-lock controls' },
    ],
  },
  'popup-news': {
    id: 'popup-news',
    label: 'Pop-Up News Builder',
    mode: 'blocks',
    canvasLabel: 'Pop-Up Preview',
    emptyTitle: 'Section content',
    emptyHint: 'Drag elements into this section',
    serialize: { wrap: false },
    defaultBlocks: createDefaultPopupNewsBlocks,
    allowedBlocks: DEFAULT_ALLOWED_BLOCKS,
    features: [
      { key: 'multi-section', label: 'Multi-section content authoring' },
      { key: 'cta-buttons', label: 'Ordered CTA buttons with internal links' },
      { key: 'display-rules', label: 'Timeline and close behavior controls' },
      { key: 'embedded-survey', label: 'Embedded survey and completion requirement' },
      { key: 'edit-preview', label: 'Edit and preview canvas modes' },
    ],
  },
};

export const getContentComposerProfile = (id: ContentComposerCase): ContentComposerProfile =>
  CONTENT_COMPOSER_PROFILES[id];

export const parseComposerDocument = (
  html: string | null | undefined,
  profileId: ContentComposerCase
): BuilderDocument => {
  const parsed = parseDocumentFromHtml(html);
  if (parsed.blocks.length > 0) return parsed;
  return {
    blocks: getContentComposerProfile(profileId).defaultBlocks(),
    base: createBaseProperties(),
  };
};

export const serializeComposerDocument = (
  profileId: ContentComposerCase,
  blocks: BuilderBlock[],
  base?: BaseProperties
): SerializedComposerOutput => {
  const profile = getContentComposerProfile(profileId);
  const renderOptions: RenderOptions = {
    ...profile.serialize,
    base,
  };
  return {
    html: serializeBlocksToHtml(blocks, renderOptions),
    plainText: blocksToPlainText(blocks),
  };
};

export const renderComposerPreviewHtml = (
  profileId: ContentComposerCase,
  blocks: BuilderBlock[],
  base?: BaseProperties
): string => {
  const profile = getContentComposerProfile(profileId);
  return renderBlocksToHtml(blocks, { ...profile.serialize, base });
};
