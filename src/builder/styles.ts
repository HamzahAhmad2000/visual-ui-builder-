// Breakpoint + style layer system for the visual content builder.
//
// Design rule (mirrors the product spec): **content is shared across
// breakpoints, layout is per-breakpoint**. A block owns exactly one copy of its
// text/url/image, and a stack of style layers keyed by breakpoint. Editing the
// tablet layer can never change what the mobile layer says, only how it looks.
//
// Emission strategy is "hybrid/spongy" (see documentation/content-builder.md):
// the widest layer is written as inline styles so clients that ignore <style>
// (Outlook desktop, Gmail app on non-Google accounts) still get a correct
// desktop rendering, and the narrower layers are emitted as media-query rules
// scoped to a per-block class for clients that honour them.

export type Align = 'left' | 'center' | 'right';

export type BreakpointId = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface Breakpoint {
  id: BreakpointId;
  label: string;
  /**
   * Upper bound of the viewport range this layer styles, in px.
   * `null` marks the base layer — it has no media query and is emitted inline.
   */
  maxWidth: number | null;
  /** Width of the canvas preview frame while this breakpoint is active. */
  previewWidth: number;
}

/**
 * Ordered widest → narrowest. Emission order matters: later rules must win in
 * the cascade, so narrower breakpoints are written after wider ones.
 *
 * Note on email reality: `laptop` is included because the spec asks for it, but
 * no email client can distinguish a laptop from a desktop — both report the
 * same viewport class. It is useful for the web surfaces (announcements,
 * pop-up news); in an inbox it will almost always resolve to the base layer.
 */
export const BREAKPOINTS: Breakpoint[] = [
  { id: 'desktop', label: 'Desktop', maxWidth: null, previewWidth: 700 },
  { id: 'laptop', label: 'Laptop', maxWidth: 1024, previewWidth: 640 },
  { id: 'tablet', label: 'Tablet', maxWidth: 768, previewWidth: 520 },
  { id: 'mobile', label: 'Mobile', maxWidth: 480, previewWidth: 360 },
];

export const BASE_BREAKPOINT: BreakpointId = 'desktop';

export const getBreakpoint = (id: BreakpointId): Breakpoint =>
  BREAKPOINTS.find((bp) => bp.id === id) || BREAKPOINTS[0];

/** Breakpoints from the base layer down to `id`, widest first. */
export const breakpointChain = (id: BreakpointId): Breakpoint[] => {
  const index = BREAKPOINTS.findIndex((bp) => bp.id === id);
  return BREAKPOINTS.slice(0, index < 0 ? 1 : index + 1);
};

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';

export const BORDER_STYLE_OPTIONS: { value: BorderStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

/** How a layout row arranges its columns at a given breakpoint. */
export type StackDirection = 'horizontal' | 'vertical';

export interface BoxSides {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * One style layer. Every field is optional: an unset field inherits from the
 * next-widest layer, which is what makes "only override what changes" work.
 */
export interface StyleProps {
  padding?: BoxSides;
  margin?: BoxSides;
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: BorderStyle;
  borderRadius?: number;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  align?: Align;
  /** Layout rows only — horizontal keeps columns side by side, vertical stacks. */
  stack?: StackDirection;
  /** Hide this element at this breakpoint only. */
  hidden?: boolean;
}

export type ResponsiveStyles = Partial<Record<BreakpointId, StyleProps>>;

/**
 * Document-level defaults. Per the spec these own the canvas envelope —
 * min/max dimensions and the background — while elements own their own box.
 */
export interface BaseProperties {
  style: StyleProps;
  responsive: ResponsiveStyles;
}

export const createBaseProperties = (seed?: Partial<BaseProperties>): BaseProperties => ({
  style: sanitizeStyle(seed?.style) ?? {},
  responsive: sanitizeResponsive(seed?.responsive),
});

// ---------------------------------------------------------------------------
// Validation — style layers arrive from untrusted JSON (the persistence marker
// is user-editable HTML), so everything is re-checked on the way in.
// ---------------------------------------------------------------------------

const HEX_OR_CSS_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/;

/** CSS length: a bare number (treated as px), or a number with a unit. */
const CSS_LENGTH = /^-?\d+(\.\d+)?(px|%|em|rem|vh|vw)?$/;

const clampNumber = (value: unknown, min: number, max: number): number | undefined => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(min, Math.min(max, num));
};

const sanitizeColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || !HEX_OR_CSS_COLOR.test(trimmed)) return undefined;
  return trimmed;
};

const sanitizeLength = (value: unknown): string | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `${value}px` : undefined;
  }
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || !CSS_LENGTH.test(trimmed)) return undefined;
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

/**
 * Background images are emitted into a CSS `url()`, so anything that could
 * break out of the declaration is rejected outright.
 */
const sanitizeBackgroundImage = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/[)"'\\;]/.test(trimmed)) return undefined;
  if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return undefined;
  return trimmed;
};

const sanitizeSides = (value: unknown): BoxSides | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const sides: BoxSides = {};
  let hasAny = false;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const num = clampNumber(raw[side], -200, 400);
    if (num !== undefined) {
      sides[side] = num;
      hasAny = true;
    }
  }
  return hasAny ? sides : undefined;
};

const isBorderStyle = (value: unknown): value is BorderStyle =>
  BORDER_STYLE_OPTIONS.some((option) => option.value === value);

const isAlign = (value: unknown): value is Align =>
  value === 'left' || value === 'center' || value === 'right';

/** Drop unknown/invalid fields and return `undefined` if nothing survives. */
export const sanitizeStyle = (value: unknown): StyleProps | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const style: StyleProps = {};

  const padding = sanitizeSides(raw.padding);
  if (padding) style.padding = padding;

  const margin = sanitizeSides(raw.margin);
  if (margin) style.margin = margin;

  const backgroundColor = sanitizeColor(raw.backgroundColor);
  if (backgroundColor) style.backgroundColor = backgroundColor;

  const backgroundImage = sanitizeBackgroundImage(raw.backgroundImage);
  if (backgroundImage) style.backgroundImage = backgroundImage;

  const textColor = sanitizeColor(raw.textColor);
  if (textColor) style.textColor = textColor;

  const borderColor = sanitizeColor(raw.borderColor);
  if (borderColor) style.borderColor = borderColor;

  const borderWidth = clampNumber(raw.borderWidth, 0, 40);
  if (borderWidth !== undefined) style.borderWidth = borderWidth;

  if (isBorderStyle(raw.borderStyle)) style.borderStyle = raw.borderStyle;

  const borderRadius = clampNumber(raw.borderRadius, 0, 200);
  if (borderRadius !== undefined) style.borderRadius = borderRadius;

  for (const key of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const) {
    const length = sanitizeLength(raw[key]);
    if (length) style[key] = length;
  }

  if (isAlign(raw.align)) style.align = raw.align;
  if (raw.stack === 'horizontal' || raw.stack === 'vertical') style.stack = raw.stack;
  if (raw.hidden === true) style.hidden = true;

  return Object.keys(style).length > 0 ? style : undefined;
};

export const sanitizeResponsive = (value: unknown): ResponsiveStyles => {
  if (!value || typeof value !== 'object') return {};
  const raw = value as Record<string, unknown>;
  const result: ResponsiveStyles = {};
  for (const bp of BREAKPOINTS) {
    const layer = sanitizeStyle(raw[bp.id]);
    if (layer) result[bp.id] = layer;
  }
  return result;
};

// ---------------------------------------------------------------------------
// Resolution — flatten the layer stack for a given breakpoint.
// ---------------------------------------------------------------------------

/**
 * Merge the base style with every responsive layer from `desktop` down to
 * `target`, so a tablet value inherits desktop unless it overrides it.
 */
export const resolveStyle = (
  base: StyleProps | undefined,
  responsive: ResponsiveStyles | undefined,
  target: BreakpointId
): StyleProps => {
  let resolved: StyleProps = { ...(base || {}) };
  for (const bp of breakpointChain(target)) {
    const layer = responsive?.[bp.id];
    if (!layer) continue;
    resolved = {
      ...resolved,
      ...layer,
      // Box sides merge per-side so overriding only `top` keeps the rest.
      padding: layer.padding
        ? { ...(resolved.padding || {}), ...layer.padding }
        : resolved.padding,
      margin: layer.margin ? { ...(resolved.margin || {}), ...layer.margin } : resolved.margin,
    };
  }
  return resolved;
};

/** True when this breakpoint layer sets anything at all (drives the UI dot). */
export const hasOverrides = (
  responsive: ResponsiveStyles | undefined,
  id: BreakpointId
): boolean => Object.keys(responsive?.[id] || {}).length > 0;

// ---------------------------------------------------------------------------
// CSS emission
// ---------------------------------------------------------------------------

const sidesToCss = (sides: BoxSides | undefined): string | undefined => {
  if (!sides) return undefined;
  const { top = 0, right = 0, bottom = 0, left = 0 } = sides;
  return `${top}px ${right}px ${bottom}px ${left}px`;
};

/**
 * Convert a resolved style layer into CSS declarations.
 *
 * `stack` and `hidden` are layout concerns handled by the renderer (they need
 * `!important` and element-specific selectors), so they are excluded here.
 */
export const styleToDeclarations = (style: StyleProps): Record<string, string> => {
  const declarations: Record<string, string> = {};

  const padding = sidesToCss(style.padding);
  if (padding) declarations.padding = padding;

  const margin = sidesToCss(style.margin);
  if (margin) declarations.margin = margin;

  if (style.backgroundColor) declarations['background-color'] = style.backgroundColor;
  if (style.backgroundImage) {
    declarations['background-image'] = `url(${style.backgroundImage})`;
    declarations['background-size'] = 'cover';
    declarations['background-position'] = 'center';
  }
  if (style.textColor) declarations.color = style.textColor;

  // A border only renders if it has a style; width alone does nothing.
  if (style.borderStyle && style.borderStyle !== 'none') {
    declarations['border-style'] = style.borderStyle;
    declarations['border-width'] = `${style.borderWidth ?? 1}px`;
    declarations['border-color'] = style.borderColor || '#000000';
  }
  if (style.borderRadius !== undefined) {
    declarations['border-radius'] = `${style.borderRadius}px`;
  }

  if (style.minWidth) declarations['min-width'] = style.minWidth;
  if (style.maxWidth) declarations['max-width'] = style.maxWidth;
  if (style.minHeight) declarations['min-height'] = style.minHeight;
  if (style.maxHeight) declarations['max-height'] = style.maxHeight;
  if (style.align) declarations['text-align'] = style.align;

  return declarations;
};

const declarationsToString = (declarations: Record<string, string>, important = false) =>
  Object.entries(declarations)
    .map(([prop, value]) => `${prop}:${value}${important ? ' !important' : ''};`)
    .join('');

/** Inline `style` attribute value for the base layer. */
export const styleToInlineCss = (style: StyleProps): string =>
  declarationsToString(styleToDeclarations(style));

/** React inline style object, used by the canvas preview. */
export const styleToReactStyle = (style: StyleProps): React.CSSProperties => {
  const declarations = styleToDeclarations(style);
  const result: Record<string, string> = {};
  for (const [prop, value] of Object.entries(declarations)) {
    // css-property -> cssProperty
    const camel = prop.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    result[camel] = value;
  }
  return result as React.CSSProperties;
};

/** Stable, CSS-safe class name for a block id. */
export const blockClassName = (id: string): string => `bb-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

export interface ResponsiveRule {
  breakpoint: Breakpoint;
  /** Full CSS rule bodies, already scoped to the block class. */
  rules: string[];
}

/**
 * Build the media-query rules for one block. Only breakpoints that actually
 * override something produce output, so untouched blocks add zero bytes.
 */
export const buildResponsiveRules = (
  className: string,
  base: StyleProps | undefined,
  responsive: ResponsiveStyles | undefined,
  options: { isLayoutRow?: boolean } = {}
): ResponsiveRule[] => {
  const output: ResponsiveRule[] = [];

  for (const bp of BREAKPOINTS) {
    if (bp.maxWidth === null) continue; // base layer is inline, never a query
    const layer = responsive?.[bp.id];
    if (!layer || Object.keys(layer).length === 0) continue;

    // Resolve so that e.g. a border-width set on desktop still applies when
    // tablet only changes border-color.
    const resolved = resolveStyle(base, responsive, bp.id);
    const rules: string[] = [];

    // Email clients need !important to beat the inline base styles.
    const declarations = styleToDeclarations(resolved);
    if (Object.keys(declarations).length > 0) {
      rules.push(`.${className}{${declarationsToString(declarations, true)}}`);
    }

    if (layer.hidden === true) {
      rules.push(
        `.${className}{display:none !important;max-height:0 !important;overflow:hidden !important;}`
      );
    } else if (layer.hidden === false) {
      rules.push(`.${className}{display:block !important;max-height:none !important;}`);
    }

    // Column stacking: the hybrid technique. Columns are inline-block cells
    // inside a ghost table, so flipping them to width:100% stacks them in
    // clients that honour the query while Outlook keeps the table layout.
    if (options.isLayoutRow && layer.stack) {
      if (layer.stack === 'vertical') {
        rules.push(
          `.${className} .bb-col{display:block !important;width:100% !important;max-width:100% !important;}`
        );
      } else {
        rules.push(`.${className} .bb-col{display:inline-block !important;}`);
      }
    }

    if (rules.length > 0) output.push({ breakpoint: bp, rules });
  }

  return output;
};

/** Wrap collected rules into a single `<style>` block, widest query first. */
export const renderStyleBlock = (rules: ResponsiveRule[]): string => {
  if (rules.length === 0) return '';

  // Group by breakpoint so we emit one media query per breakpoint rather than
  // one per block, then order widest → narrowest so narrow layers win.
  const byBreakpoint = new Map<BreakpointId, string[]>();
  for (const entry of rules) {
    const existing = byBreakpoint.get(entry.breakpoint.id) || [];
    byBreakpoint.set(entry.breakpoint.id, [...existing, ...entry.rules]);
  }

  const blocks: string[] = [];
  for (const bp of BREAKPOINTS) {
    const bpRules = byBreakpoint.get(bp.id);
    if (!bpRules || bpRules.length === 0 || bp.maxWidth === null) continue;
    blocks.push(`@media only screen and (max-width:${bp.maxWidth}px){${bpRules.join('')}}`);
  }

  if (blocks.length === 0) return '';
  return `<style type="text/css">${blocks.join('')}</style>`;
};
