// Shared block model for the visual content builder used by announcements,
// pop-up news, and email templates. Blocks are serialized to inline-styled
// HTML (email-safe) plus an embedded JSON marker so saved content can be
// re-opened in the builder without any backend schema changes.
// See documentation/content-builder.md for the full architecture notes.

import { v4 as uuidv4 } from 'uuid';
import { resolveMediaUrl } from '../utils/media-url';
import {
  BASE_BREAKPOINT,
  blockClassName,
  buildResponsiveRules,
  createBaseProperties,
  renderStyleBlock,
  resolveStyle,
  sanitizeResponsive,
  sanitizeStyle,
  styleToInlineCss,
  type Align,
  type BaseProperties,
  type BreakpointId,
  type ResponsiveRule,
  type ResponsiveStyles,
  type StyleProps,
} from './styles';

export * from './styles';
export type { Align };

export type BuilderBlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'social_icon'
  | 'layout_row';

export type SocialIconType =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'github';

interface BaseBlock {
  id: string;
  type: BuilderBlockType;
  /**
   * Base (widest-breakpoint) styling, emitted as inline CSS so it survives
   * clients that strip <style>. Optional — blocks saved before the style
   * system existed simply have no layers and render exactly as before.
   */
  style?: StyleProps;
  /** Per-breakpoint layout overrides. Content is never stored here. */
  responsive?: ResponsiveStyles;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: Align;
  color: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  html: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  width: number;
  height: number;
  align: Align;
  borderRadius: number;
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  url: string;
  popupId?: number | null;
  align: Align;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fullWidth: boolean;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  color: string;
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: number;
}

export interface HtmlBlock extends BaseBlock {
  type: 'html';
  html: string;
}

export interface SocialIconBlock extends BaseBlock {
  type: 'social_icon';
  socialIcon: SocialIconType;
  socialUrl: string;
  socialColor: string;
  socialSize: number;
}

/**
 * A column is a first-class, selectable entity: it carries its own style
 * layers just like a block, so "each column should be selectable" and
 * per-column visuals work without wrapping every column in a spacer block.
 */
export interface LayoutRowColumn {
  id: string;
  elements: BuilderBlock[];
  style?: StyleProps;
  responsive?: ResponsiveStyles;
  /** Relative width weight within the row. Equal weights split evenly. */
  weight?: number;
}

export interface LayoutRowBlock extends BaseBlock {
  type: 'layout_row';
  columns: LayoutRowColumn[];
  /** Gutter between columns, in px. */
  gap?: number;
}

export type BuilderBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | HtmlBlock
  | SocialIconBlock
  | LayoutRowBlock;

export const BLOCK_LABELS: Record<BuilderBlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  spacer: 'Spacer',
  html: 'HTML Block',
  social_icon: 'Social Icon',
  layout_row: 'Layout Row',
};

export const SOCIAL_ICON_OPTIONS: { value: SocialIconType; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
];

export const SOCIAL_ICON_SVGS: Record<SocialIconType, string> = {
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  facebook: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  twitter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  youtube: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  github: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeAlign = (value: unknown): Align =>
  value === 'center' || value === 'right' ? value : 'left';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Build a block of `type`, validating any seed values.
 *
 * Style layers are handled once here rather than in every case, so new block
 * types get padding/border/breakpoint support for free.
 */
export const createBlock = (
  type: BuilderBlockType,
  initial?: Partial<BuilderBlock>
): BuilderBlock => {
  const block = createBlockContent(type, initial);
  const style = sanitizeStyle(initial?.style);
  const responsive = sanitizeResponsive(initial?.responsive);
  if (style) block.style = style;
  if (Object.keys(responsive).length > 0) block.responsive = responsive;
  return block;
};

const createBlockContent = (
  type: BuilderBlockType,
  initial?: Partial<BuilderBlock>
): BuilderBlock => {
  const id = uuidv4();
  switch (type) {
    case 'heading': {
      const seed = initial as Partial<HeadingBlock> | undefined;
      return {
        id,
        type,
        text: typeof seed?.text === 'string' ? seed.text : 'Add your heading',
        level: seed?.level === 1 || seed?.level === 3 ? seed.level : 2,
        align: normalizeAlign(seed?.align),
        color: typeof seed?.color === 'string' ? seed.color : '#111827',
      };
    }
    case 'text': {
      const seed = initial as Partial<TextBlock> | undefined;
      return {
        id,
        type,
        html:
          typeof seed?.html === 'string'
            ? seed.html
            : '<p>Enter your text here...</p>',
      };
    }
    case 'image': {
      const seed = initial as Partial<ImageBlock> | undefined;
      return {
        id,
        type,
        src: typeof seed?.src === 'string' ? seed.src : '',
        alt: typeof seed?.alt === 'string' ? seed.alt : 'Image',
        width: typeof seed?.width === 'number' ? clamp(seed.width, 40, 700) : 320,
        height: typeof seed?.height === 'number' ? clamp(seed.height, 40, 700) : 220,
        align: normalizeAlign(seed?.align ?? 'center'),
        borderRadius:
          typeof seed?.borderRadius === 'number' ? clamp(seed.borderRadius, 0, 48) : 8,
      };
    }
    case 'button': {
      const seed = initial as Partial<ButtonBlock> | undefined;
      return {
        id,
        type,
        text: typeof seed?.text === 'string' ? seed.text : 'Click Here',
        url: typeof seed?.url === 'string' ? seed.url : '',
        popupId:
          typeof seed?.popupId === 'number' && Number.isFinite(seed.popupId) && seed.popupId > 0
            ? seed.popupId
            : null,
        align: normalizeAlign(seed?.align),
        backgroundColor:
          typeof seed?.backgroundColor === 'string' ? seed.backgroundColor : '#8B5CF6',
        textColor: typeof seed?.textColor === 'string' ? seed.textColor : '#ffffff',
        borderRadius:
          typeof seed?.borderRadius === 'number' ? clamp(seed.borderRadius, 0, 48) : 8,
        fullWidth: seed?.fullWidth === true,
      };
    }
    case 'divider': {
      const seed = initial as Partial<DividerBlock> | undefined;
      return {
        id,
        type,
        color: typeof seed?.color === 'string' ? seed.color : '#e5e7eb',
      };
    }
    case 'spacer': {
      const seed = initial as Partial<SpacerBlock> | undefined;
      return {
        id,
        type,
        height: typeof seed?.height === 'number' ? clamp(seed.height, 4, 160) : 24,
      };
    }
    case 'social_icon': {
      const seed = initial as Partial<SocialIconBlock> | undefined;
      return {
        id,
        type,
        socialIcon: seed?.socialIcon || 'instagram',
        socialUrl: typeof seed?.socialUrl === 'string' ? seed.socialUrl : '',
        socialColor: typeof seed?.socialColor === 'string' ? seed.socialColor : '#000000',
        socialSize:
          typeof seed?.socialSize === 'number' ? clamp(seed.socialSize, 16, 64) : 24,
      };
    }
    case 'layout_row': {
      const seed = initial as Partial<LayoutRowBlock> | undefined;
      const columns: LayoutRowColumn[] = Array.isArray(seed?.columns)
        ? seed!.columns!.map((col) => reviveColumn(col))
        : [createColumn(), createColumn()];
      const gap =
        typeof seed?.gap === 'number' && Number.isFinite(seed.gap)
          ? clamp(seed.gap, 0, 64)
          : undefined;
      return gap === undefined ? { id, type, columns } : { id, type, columns, gap };
    }
    case 'html':
    default: {
      const seed = initial as Partial<HtmlBlock> | undefined;
      return {
        id,
        type: 'html',
        html:
          typeof seed?.html === 'string'
            ? seed.html
            : '<div style="padding:16px;background-color:#f5f5f5;">\n  <p>Edit this HTML content in the settings panel.</p>\n</div>',
      };
    }
  }
};

export const createColumn = (initial?: Partial<LayoutRowColumn>): LayoutRowColumn => {
  const column: LayoutRowColumn = { id: uuidv4(), elements: [] };
  const style = sanitizeStyle(initial?.style);
  const responsive = sanitizeResponsive(initial?.responsive);
  if (style) column.style = style;
  if (Object.keys(responsive).length > 0) column.responsive = responsive;
  if (typeof initial?.weight === 'number' && Number.isFinite(initial.weight)) {
    column.weight = clamp(initial.weight, 1, 12);
  }
  return column;
};

/** Re-create a column from untrusted JSON, reviving its nested blocks. */
const reviveColumn = (raw: unknown): LayoutRowColumn => {
  const seed = (raw && typeof raw === 'object' ? raw : {}) as Partial<LayoutRowColumn>;
  const column = createColumn(seed);
  column.elements = Array.isArray(seed.elements)
    ? (seed.elements.map((el) => reviveBlock(el)).filter(Boolean) as BuilderBlock[])
    : [];
  return column;
};

export const createLayoutRow = (columnCount: number): LayoutRowBlock => {
  const columns: LayoutRowColumn[] = Array.from({ length: clamp(columnCount, 1, 4) }, () =>
    createColumn()
  );
  return { id: uuidv4(), type: 'layout_row', columns };
};

/** Re-create a block (with fresh validation) from untrusted/parsed JSON. */
export const reviveBlock = (raw: unknown): BuilderBlock | null => {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<BuilderBlock> & { type?: string };
  if (!candidate.type || !(candidate.type in BLOCK_LABELS)) return null;
  return createBlock(candidate.type as BuilderBlockType, candidate as Partial<BuilderBlock>);
};

// ---------------------------------------------------------------------------
// Recursive block-list helpers (top-level blocks + layout row columns)
// ---------------------------------------------------------------------------

export const findBlockById = (blocks: BuilderBlock[], id: string): BuilderBlock | null => {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'layout_row') {
      for (const col of block.columns) {
        const found = findBlockById(col.elements, id);
        if (found) return found;
      }
    }
  }
  return null;
};

export const updateBlockById = (
  blocks: BuilderBlock[],
  id: string,
  next: BuilderBlock
): BuilderBlock[] =>
  blocks.map((block) => {
    if (block.id === id) return next;
    if (block.type === 'layout_row') {
      return {
        ...block,
        columns: block.columns.map((col) => ({
          ...col,
          elements: updateBlockById(col.elements, id, next),
        })),
      };
    }
    return block;
  });

export const removeBlockById = (blocks: BuilderBlock[], id: string): BuilderBlock[] =>
  blocks
    .filter((block) => block.id !== id)
    .map((block) =>
      block.type === 'layout_row'
        ? {
            ...block,
            columns: block.columns.map((col) => ({
              ...col,
              elements: removeBlockById(col.elements, id),
            })),
          }
        : block
    );

/** Insert a block into a specific layout-row column. */
export const insertBlockIntoColumn = (
  blocks: BuilderBlock[],
  rowId: string,
  columnId: string,
  newBlock: BuilderBlock
): BuilderBlock[] =>
  blocks.map((block) => {
    if (block.type !== 'layout_row' || block.id !== rowId) return block;
    return {
      ...block,
      columns: block.columns.map((col) =>
        col.id === columnId ? { ...col, elements: [...col.elements, newBlock] } : col
      ),
    };
  });

/**
 * Insert into a column identified by id alone, at any depth.
 *
 * Column ids are unique, so the row id is unnecessary — and requiring it would
 * break drops into nested rows, where the caller only knows the outer row.
 */
export const insertBlockIntoColumnById = (
  blocks: BuilderBlock[],
  columnId: string,
  newBlock: BuilderBlock
): BuilderBlock[] =>
  blocks.map((block) => {
    if (block.type !== 'layout_row') return block;
    return {
      ...block,
      columns: block.columns.map((col) =>
        col.id === columnId
          ? { ...col, elements: [...col.elements, newBlock] }
          : { ...col, elements: insertBlockIntoColumnById(col.elements, columnId, newBlock) }
      ),
    };
  });

/** Find a column anywhere in the tree, including inside nested layout rows. */
export const findColumnById = (
  blocks: BuilderBlock[],
  columnId: string
): LayoutRowColumn | null => {
  for (const block of blocks) {
    if (block.type !== 'layout_row') continue;
    for (const col of block.columns) {
      if (col.id === columnId) return col;
      const nested = findColumnById(col.elements, columnId);
      if (nested) return nested;
    }
  }
  return null;
};

/** Replace a column anywhere in the tree, preserving structure. */
export const updateColumnById = (
  blocks: BuilderBlock[],
  columnId: string,
  next: LayoutRowColumn
): BuilderBlock[] =>
  blocks.map((block) => {
    if (block.type !== 'layout_row') return block;
    return {
      ...block,
      columns: block.columns.map((col) =>
        col.id === columnId
          ? next
          : { ...col, elements: updateColumnById(col.elements, columnId, next) }
      ),
    };
  });

// ---------------------------------------------------------------------------
// HTML rendering — the same output is used for the live canvas preview and the
// persisted HTML, which is what keeps the editor and the real views in sync.
// ---------------------------------------------------------------------------

/** Nominal content width used to size hybrid columns, in px. */
export const EMAIL_CONTENT_WIDTH = 700;

/**
 * Collects the media-query rules emitted while walking the block tree, so the
 * caller can hoist them into a single <style> block.
 */
export interface RenderContext {
  rules: ResponsiveRule[];
}

const hasStyleLayers = (
  target: { style?: StyleProps; responsive?: ResponsiveStyles } | undefined
): boolean =>
  Boolean(
    target &&
      ((target.style && Object.keys(target.style).length > 0) ||
        (target.responsive && Object.keys(target.responsive).length > 0))
  );

/**
 * Wrap rendered content in a styled container and register its responsive
 * rules. Blocks with no style layers are returned untouched, which keeps the
 * output byte-identical to the pre-style-system renderer for existing content.
 */
const applyStyleWrapper = (
  block: BuilderBlock,
  inner: string,
  ctx?: RenderContext,
  at: BreakpointId = BASE_BREAKPOINT
): string => {
  if (!hasStyleLayers(block)) return inner;

  const className = blockClassName(block.id);
  const resolvedStyle = resolveStyle(block.style, block.responsive, at);

  if (ctx) {
    const rules = buildResponsiveRules(className, block.style, block.responsive, {
      isLayoutRow: block.type === 'layout_row',
    });
    ctx.rules.push(...rules);
  }

  const inlineCss = styleToInlineCss(resolvedStyle);
  // Only the email output hides outright; canvas previews keep hidden blocks
  // visible (dimmed by the canvas) so they stay selectable.
  const hidden = at === BASE_BREAKPOINT && resolvedStyle.hidden === true ? 'display:none;' : '';
  return `<div class="${className}" style="${inlineCss}${hidden}">${inner}</div>`;
};

/**
 * Render one block.
 *
 * `at` selects which breakpoint layer is flattened into inline styles. The
 * default (base) is what gets emailed; the canvas passes the active breakpoint
 * so the preview shows that layer without relying on viewport media queries.
 */
export const renderBlockToHtml = (
  block: BuilderBlock,
  ctx?: RenderContext,
  at: BreakpointId = BASE_BREAKPOINT
): string => applyStyleWrapper(block, renderBlockInner(block, ctx, at), ctx, at);

const renderBlockInner = (
  block: BuilderBlock,
  ctx?: RenderContext,
  at: BreakpointId = BASE_BREAKPOINT
): string => {
  switch (block.type) {
    case 'heading': {
      const tag = `h${block.level}`;
      const sizes: Record<number, string> = { 1: '28px', 2: '22px', 3: '18px' };
      return `<${tag} style="margin:0 0 12px;text-align:${block.align};color:${escapeHtml(
        block.color || '#111827'
      )};font-size:${sizes[block.level]};line-height:1.3;">${escapeHtml(block.text)}</${tag}>`;
    }
    case 'text':
      return `<div style="margin:0 0 12px;line-height:1.6;">${block.html}</div>`;
    case 'image': {
      if (!block.src.trim()) return '';
      const src = resolveMediaUrl(block.src) || block.src;
      return `<div style="margin:0 0 14px;text-align:${block.align};"><img src="${escapeHtml(
        src
      )}" alt="${escapeHtml(block.alt || 'Image')}" style="max-width:100%;width:${clamp(
        block.width,
        40,
        700
      )}px;height:${clamp(block.height, 40, 700)}px;object-fit:cover;border-radius:${clamp(
        block.borderRadius,
        0,
        48
      )}px;display:inline-block;" /></div>`;
    }
    case 'button': {
      const width = block.fullWidth ? 'display:block;width:100%;box-sizing:border-box;' : 'display:inline-block;';
      const popupAttribute = block.popupId ? ` data-popup-id="${block.popupId}"` : '';
      return `<div style="margin:0 0 14px;text-align:${block.align};"><a href="${escapeHtml(
        block.url || '#'
      )}"${popupAttribute} style="${width}padding:10px 16px;border-radius:${clamp(
        block.borderRadius,
        0,
        48
      )}px;background:${escapeHtml(block.backgroundColor)};color:${escapeHtml(
        block.textColor
      )};text-decoration:none;font-weight:600;text-align:center;">${escapeHtml(
        block.text
      )}</a></div>`;
    }
    case 'divider':
      return `<hr style="border:none;border-top:1px solid ${escapeHtml(
        block.color
      )};margin:16px 0;" />`;
    case 'spacer':
      return `<div style="height:${clamp(block.height, 4, 160)}px;"></div>`;
    case 'html':
      return block.html;
    case 'social_icon': {
      const iconSvg = SOCIAL_ICON_SVGS[block.socialIcon] || '';
      const size = clamp(block.socialSize, 16, 64);
      const inner = `<span style="display:inline-block;color:${escapeHtml(
        block.socialColor
      )};width:${size}px;height:${size}px;">${iconSvg}</span>`;
      const wrapper = block.socialUrl
        ? `<a href="${escapeHtml(
            block.socialUrl
          )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:${escapeHtml(
            block.socialColor
          )};width:${size}px;height:${size}px;">${iconSvg}</a>`
        : inner;
      return `<div style="margin:0 0 12px;text-align:center;">${wrapper}</div>`;
    }
    case 'layout_row': {
      // Hybrid/"spongy" columns: inline-block cells that are width:100% with a
      // px max-width. With room they sit side by side; without it they wrap on
      // their own — so stacking still works in clients that ignore media
      // queries. MSO conditional comments wrap the whole thing in a ghost
      // table because Outlook's Word engine ignores inline-block entirely.
      const columns = block.columns;
      const count = Math.max(1, columns.length);
      const gap = block.gap ?? 8;
      const totalWeight = columns.reduce((sum, col) => sum + (col.weight ?? 1), 0) || count;

      // When previewing a specific breakpoint we flatten stacking inline,
      // because the canvas cannot rely on viewport-driven media queries.
      const stacked =
        at !== BASE_BREAKPOINT &&
        resolveStyle(block.style, block.responsive, at).stack === 'vertical';

      const cells = columns.map((col) => {
        const weight = col.weight ?? 1;
        const share = weight / totalWeight;
        const pct = Math.round(share * 10000) / 100;
        const maxWidthPx = Math.floor(EMAIL_CONTENT_WIDTH * share);

        const colClass = blockClassName(col.id);
        const colStyle = resolveStyle(col.style, col.responsive, at);
        if (ctx && hasStyleLayers(col)) {
          ctx.rules.push(...buildResponsiveRules(colClass, col.style, col.responsive));
        }

        // font-size is reset because the parent zeroes it to kill the
        // whitespace gap between inline-block elements.
        const cellCss = [
          stacked ? 'display:block' : 'display:inline-block',
          'width:100%',
          stacked ? 'max-width:100%' : `max-width:${maxWidthPx}px`,
          'vertical-align:top',
          'font-size:14px',
          'line-height:1.5',
          `padding:${Math.floor(gap / 2)}px`,
          'box-sizing:border-box',
        ].join(';');

        const inner = renderBlocksToHtml(col.elements, { wrap: false, ctx, breakpoint: at });
        const mso = `<!--[if mso]><td width="${pct}%" style="vertical-align:top;padding:${Math.floor(
          gap / 2
        )}px;"><![endif]-->`;
        const msoEnd = '<!--[if mso]></td><![endif]-->';

        return `${mso}<div class="bb-col ${colClass}" style="${cellCss};${styleToInlineCss(
          colStyle
        )}">${inner}</div>${msoEnd}`;
      });

      return [
        '<div style="margin:0 0 14px;">',
        '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><![endif]-->',
        // font-size:0 removes the ~4px whitespace gap between inline-blocks.
        '<div style="font-size:0;text-align:left;">',
        cells.join(''),
        '</div>',
        '<!--[if mso]></tr></table><![endif]-->',
        '</div>',
      ].join('');
    }
    default:
      return '';
  }
};

export interface RenderOptions {
  /**
   * Wrap output in an email-style container (font family + base color).
   * Use `false` for surfaces that already have their own typography, such as
   * the announcement bar or pop-up modal.
   */
  wrap?: boolean;
  /**
   * Shared collector for responsive rules. Passed automatically during
   * recursion; callers normally omit it and let the top-level call create one.
   */
  ctx?: RenderContext;
  /** Document-level base properties applied to the outer wrapper. */
  base?: BaseProperties;
  /**
   * Flatten this breakpoint's layer into inline styles instead of the base
   * layer. Used by the canvas preview; email output always uses the default.
   */
  breakpoint?: BreakpointId;
}

export const renderBlocksToHtml = (
  blocks: BuilderBlock[],
  options: RenderOptions = {}
): string => {
  const { wrap = true, base, breakpoint = BASE_BREAKPOINT } = options;

  // Nested calls reuse the parent context so every rule ends up in one place;
  // the outermost call owns creating it and emitting the <style> block.
  const isRoot = !options.ctx;
  const ctx: RenderContext = options.ctx || { rules: [] };

  const rendered = blocks.map((block) => renderBlockToHtml(block, ctx, breakpoint)).join('\n');

  if (!isRoot) return rendered;

  const baseStyle = base ? resolveStyle(base.style, base.responsive, breakpoint) : undefined;
  if (base && hasStyleLayers(base)) {
    ctx.rules.push(...buildResponsiveRules('bb-base', base.style, base.responsive));
  }

  const styleBlock = renderStyleBlock(ctx.rules);

  if (!wrap) {
    // Unwrapped surfaces still need the rules, or per-breakpoint layout would
    // silently do nothing on announcements and pop-ups.
    const baseWrapper =
      base && hasStyleLayers(base)
        ? `<div class="bb-base" style="${styleToInlineCss(baseStyle || {})}">${rendered}</div>`
        : rendered;
    return `${styleBlock}${baseWrapper}`;
  }

  const wrapperCss = `font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111827;${styleToInlineCss(
    baseStyle || {}
  )}`;
  return `${styleBlock}<div class="bb-base" style="${wrapperCss}">${rendered}</div>`;
};

// ---------------------------------------------------------------------------
// Persistence: rendered HTML with an embedded, base64-encoded JSON marker so
// existing content_html/body_html columns can round-trip builder state.
// ---------------------------------------------------------------------------

const MARKER_RE = /<!--\s*builder-blocks:([A-Za-z0-9+/=]+)\s*-->/;

const encodeBase64 = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(unescape(encodeURIComponent(value)));
  }
  return Buffer.from(value, 'utf-8').toString('base64');
};

const decodeBase64 = (value: string): string => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(value)));
  }
  return Buffer.from(value, 'base64').toString('utf-8');
};

/** A builder document: the block tree plus document-level base properties. */
export interface BuilderDocument {
  blocks: BuilderBlock[];
  base: BaseProperties;
}

/**
 * Render blocks to HTML and append the hidden builder-state marker.
 *
 * The marker payload stays a bare array unless document-level base properties
 * are in use, so templates that predate them round-trip byte-identically.
 */
export const serializeBlocksToHtml = (
  blocks: BuilderBlock[],
  options: RenderOptions = {}
): string => {
  const html = renderBlocksToHtml(blocks, options);
  try {
    const { base } = options;
    const payload = base && hasStyleLayers(base) ? { v: 2, blocks, base } : blocks;
    const marker = encodeBase64(JSON.stringify(payload));
    return `${html}\n<!-- builder-blocks:${marker} -->`;
  } catch {
    return html;
  }
};

/**
 * Rebuild builder blocks from stored HTML. Prefers the embedded marker; HTML
 * authored elsewhere becomes a single editable HTML block.
 */
export const parseBlocksFromHtml = (html: string | null | undefined): BuilderBlock[] =>
  parseDocumentFromHtml(html).blocks;

/**
 * Full document restore. Accepts both marker payload shapes:
 * a bare `BuilderBlock[]` (v1) and `{ v: 2, blocks, base }`.
 */
export const parseDocumentFromHtml = (html: string | null | undefined): BuilderDocument => {
  const empty: BuilderDocument = { blocks: [], base: createBaseProperties() };
  const raw = (html || '').trim();
  if (!raw) return empty;

  const match = raw.match(MARKER_RE);
  if (match) {
    try {
      const parsed = JSON.parse(decodeBase64(match[1]));

      const rawBlocks = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { blocks?: unknown }).blocks)
          ? ((parsed as { blocks: unknown[] }).blocks)
          : null;

      if (rawBlocks) {
        const revived = rawBlocks
          .map((item) => reviveBlock(item))
          .filter(Boolean) as BuilderBlock[];
        if (revived.length > 0) {
          const base = Array.isArray(parsed)
            ? createBaseProperties()
            : createBaseProperties((parsed as { base?: Partial<BaseProperties> }).base);
          return { blocks: revived, base };
        }
      }
    } catch {
      // fall through to raw-HTML fallback
    }
  }

  const withoutMarker = stripBuilderMarker(raw);
  if (!withoutMarker) return empty;
  return { blocks: [createBlock('html', { html: withoutMarker })], base: createBaseProperties() };
};

/** Strip the marker comment from stored HTML before rendering it publicly. */
export const stripBuilderMarker = (html: string | null | undefined): string =>
  (html || '').replace(MARKER_RE, '').trim();

/** Plain-text extraction (used for e.g. the announcements `content` column). */
export const blocksToPlainText = (blocks: BuilderBlock[]): string => {
  // Drop the responsive <style> block and MSO ghost-table comments first, or
  // raw CSS and conditional markup would leak into the plain-text column.
  const html = renderBlocksToHtml(blocks, { wrap: false })
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};
