import {
  createBlock,
  createLayoutRow,
  type BuilderBlock,
  type LayoutRowBlock,
  type SocialIconType,
} from '../builder';

export interface LegacyEmailElement {
  name?: string;
  type?: string;
  content?: string;
  buttonUrl?: string;
  buttonColor?: string;
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  socialIcon?: string;
  socialUrl?: string;
  socialColor?: string;
  socialSize?: number;
}

export interface LegacyEmailLayoutRow {
  columns?: number;
  elements?: Record<string, LegacyEmailElement[]>;
}

export interface LegacyEmailTemplateState {
  canvasItems?: LegacyEmailElement[];
  layoutRows?: LegacyEmailLayoutRow[];
}

const SOCIAL_ICON_TYPES = new Set<SocialIconType>([
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'youtube',
  'github',
]);

const normalizeSocialIcon = (value: unknown): SocialIconType =>
  typeof value === 'string' && SOCIAL_ICON_TYPES.has(value as SocialIconType)
    ? (value as SocialIconType)
    : 'instagram';

const legacyElementToBlock = (item: LegacyEmailElement): BuilderBlock => {
  switch (item.name) {
    case 'Button':
      return createBlock('button', {
        text: item.content || 'Click Here',
        url: item.buttonUrl || '',
        backgroundColor: item.buttonColor || '#111827',
      });
    case 'Image':
    case 'Logo':
      return createBlock('image', {
        src: item.content || '',
        alt: item.name || 'Image',
        align: item.alignment || 'center',
      });
    case 'Divider':
      return createBlock('divider', { color: item.color || '#e5e7eb' });
    case 'Social Icon':
      return createBlock('social_icon', {
        socialIcon: normalizeSocialIcon(item.socialIcon),
        socialUrl: item.socialUrl || '',
        socialColor: item.socialColor || '#000000',
        socialSize: item.socialSize || 24,
      });
    case 'HTML Block':
      return createBlock('html', { html: item.content || '' });
    case 'Text':
    default:
      return createBlock('text', { html: `<p>${item.content || 'Enter your text here...'}</p>` });
  }
};

export const convertLegacyEmailTemplateState = (
  legacy: LegacyEmailTemplateState
): BuilderBlock[] => {
  const blocks: BuilderBlock[] = [];

  (legacy.canvasItems || []).forEach((item) => {
    blocks.push(legacyElementToBlock(item));
  });

  (legacy.layoutRows || []).forEach((row) => {
    const layout = createLayoutRow(row.columns || Object.keys(row.elements || {}).length || 2) as LayoutRowBlock;
    Object.values(row.elements || {}).forEach((items, index) => {
      const column = layout.columns[index];
      if (!column) return;
      column.elements = items.map(legacyElementToBlock);
    });
    blocks.push(layout);
  });

  return blocks;
};
