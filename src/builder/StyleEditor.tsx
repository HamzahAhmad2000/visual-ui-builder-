'use client';

import React from 'react';
import { Link2, Unlink, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { ThemedInput } from '../ui/primitives';
import { ThemedLabel } from '../ui/primitives';
import { ThemedButton } from '../ui/primitives';
import { ColorPicker } from '../ui/ColorPicker';
import {
  BASE_BREAKPOINT,
  BORDER_STYLE_OPTIONS,
  BREAKPOINTS,
  getBreakpoint,
  hasOverrides,
  resolveStyle,
  type BorderStyle,
  type BoxSides,
  type BreakpointId,
  type ResponsiveStyles,
  type StackDirection,
  type StyleProps,
} from './styles';

export interface StyleLayers {
  style?: StyleProps;
  responsive?: ResponsiveStyles;
}

interface StyleEditorProps extends StyleLayers {
  /** Layer currently being edited. */
  breakpoint: BreakpointId;
  onChange: (next: StyleLayers) => void;
  /** Show the column-stacking control (layout rows only). */
  showStacking?: boolean;
  /**
   * `base` restricts the editor to document-level properties (size and
   * background), matching the spec's split between base and element settings.
   */
  variant?: 'element' | 'base';
}

/**
 * Breakpoint-aware style editor.
 *
 * Every control writes to the *active layer*: the desktop tab edits the base
 * style (emitted inline), any other tab edits `responsive[breakpoint]`. Values
 * shown are always the resolved cascade, so a field left untouched displays
 * what it inherits rather than looking empty.
 */
export function StyleEditor({
  style,
  responsive,
  breakpoint,
  onChange,
  showStacking = false,
  variant = 'element',
}: StyleEditorProps) {
  const isBase = breakpoint === BASE_BREAKPOINT;

  /** Value as it will actually render at this breakpoint. */
  const resolved = resolveStyle(style, responsive, breakpoint);
  /** Only what this specific layer overrides — drives the "modified" dots. */
  const layer: StyleProps = isBase ? style || {} : responsive?.[breakpoint] || {};

  const writeLayer = (next: StyleProps) => {
    const cleaned: StyleProps = { ...next };
    // Drop keys that were reset so they fall back through the cascade.
    (Object.keys(cleaned) as (keyof StyleProps)[]).forEach((key) => {
      if (cleaned[key] === undefined) delete cleaned[key];
    });

    if (isBase) {
      onChange({ style: Object.keys(cleaned).length ? cleaned : undefined, responsive });
      return;
    }
    const nextResponsive: ResponsiveStyles = { ...(responsive || {}) };
    if (Object.keys(cleaned).length) {
      nextResponsive[breakpoint] = cleaned;
    } else {
      delete nextResponsive[breakpoint];
    }
    onChange({ style, responsive: nextResponsive });
  };

  const setField = <K extends keyof StyleProps>(key: K, value: StyleProps[K]) =>
    writeLayer({ ...layer, [key]: value });

  const clearLayer = () => {
    if (isBase) {
      onChange({ style: undefined, responsive });
    } else {
      const nextResponsive = { ...(responsive || {}) };
      delete nextResponsive[breakpoint];
      onChange({ style, responsive: nextResponsive });
    }
  };

  const showAll = variant === 'element';

  return (
    <div className="space-y-4">
      {!isBase && (
        <p className="rounded-md bg-purple-50 px-3 py-2 text-[11px] leading-relaxed text-purple-800">
          Editing the <strong>{getBreakpoint(breakpoint).label}</strong> layout layer. Text,
          links and images stay shared across breakpoints — only layout changes here.
        </p>
      )}

      {Object.keys(layer).length > 0 && (
        <button
          type="button"
          onClick={clearLayer}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-purple-700"
        >
          <RotateCcw className="h-3 w-3" />
          Reset {getBreakpoint(breakpoint).label} overrides
        </button>
      )}

      {showAll && (
        <>
          <SidesField
            label="Padding"
            value={resolved.padding}
            overridden={layer.padding !== undefined}
            onChange={(padding) => setField('padding', padding)}
          />
          <SidesField
            label="Margin"
            value={resolved.margin}
            overridden={layer.margin !== undefined}
            onChange={(margin) => setField('margin', margin)}
            allowNegative
          />
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <LabelledField label="Background" overridden={layer.backgroundColor !== undefined}>
          <ColorPicker
            value={resolved.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) => setField('backgroundColor', backgroundColor)}
            allowTransparent
          />
        </LabelledField>
        {showAll && (
          <LabelledField label="Text Color" overridden={layer.textColor !== undefined}>
            <ColorPicker
              value={resolved.textColor || '#111827'}
              onChange={(textColor) => setField('textColor', textColor)}
              allowTransparent
            />
          </LabelledField>
        )}
      </div>

      <LabelledField label="Background Image URL" overridden={layer.backgroundImage !== undefined}>
        <ThemedInput
          value={resolved.backgroundImage || ''}
          onChange={(e) => setField('backgroundImage', e.target.value.trim() || undefined)}
          placeholder="https://..."
        />
        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
          Many email clients ignore background images — keep a background colour as a fallback.
        </p>
      </LabelledField>

      {showAll && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <LabelledField label="Border Style" overridden={layer.borderStyle !== undefined}>
              <select
                value={resolved.borderStyle || 'none'}
                onChange={(e) => setField('borderStyle', e.target.value as BorderStyle)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-2 py-2 text-xs"
              >
                {BORDER_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LabelledField>
            <LabelledField label="Border Width (px)" overridden={layer.borderWidth !== undefined}>
              <ThemedInput
                type="number"
                min={0}
                max={40}
                value={resolved.borderWidth ?? ''}
                onChange={(e) =>
                  setField(
                    'borderWidth',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
            </LabelledField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabelledField label="Border Color" overridden={layer.borderColor !== undefined}>
              <ColorPicker
                value={resolved.borderColor || '#e5e7eb'}
                onChange={(borderColor) => setField('borderColor', borderColor)}
                allowTransparent
              />
            </LabelledField>
            <LabelledField label="Corner Radius (px)" overridden={layer.borderRadius !== undefined}>
              <ThemedInput
                type="number"
                min={0}
                max={200}
                value={resolved.borderRadius ?? ''}
                onChange={(e) =>
                  setField(
                    'borderRadius',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
            </LabelledField>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(['minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const).map((key) => (
          <LabelledField
            key={key}
            label={LENGTH_LABELS[key]}
            overridden={layer[key] !== undefined}
          >
            <ThemedInput
              value={resolved[key] || ''}
              onChange={(e) => setField(key, e.target.value.trim() || undefined)}
              placeholder="auto"
            />
          </LabelledField>
        ))}
      </div>
      <p className="-mt-2 text-[10px] text-[var(--text-secondary)]">
        Accepts px, %, em, rem, vh or vw. A bare number is treated as px.
      </p>

      {showStacking && (
        <LabelledField label="Column Stacking" overridden={layer.stack !== undefined}>
          <div className="flex gap-1.5">
            {(
              [
                { value: 'horizontal', label: 'Side by side' },
                { value: 'vertical', label: 'Stacked' },
              ] as { value: StackDirection; label: string }[]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setField('stack', option.value)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  (resolved.stack || 'horizontal') === option.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </LabelledField>
      )}

      {showAll && (
        <button
          type="button"
          onClick={() => setField('hidden', resolved.hidden ? undefined : true)}
          className="flex w-full items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium hover:border-purple-300"
        >
          <span className="text-[var(--text-secondary)]">
            {resolved.hidden ? 'Hidden' : 'Visible'} on {getBreakpoint(breakpoint).label}
          </span>
          {resolved.hidden ? (
            <EyeOff className="h-4 w-4 text-purple-600" />
          ) : (
            <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
        </button>
      )}
    </div>
  );
}

const LENGTH_LABELS = {
  minWidth: 'Min Width',
  maxWidth: 'Max Width',
  minHeight: 'Min Height',
  maxHeight: 'Max Height',
} as const;

/** A dot marks fields overridden at the active breakpoint. */
function LabelledField({
  label,
  overridden,
  children,
}: {
  label: string;
  overridden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <ThemedLabel className="flex items-center gap-1.5 text-xs font-medium">
        {label}
        {overridden && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-purple-500"
            title="Overridden at this breakpoint"
          />
        )}
      </ThemedLabel>
      {children}
    </div>
  );
}

/** Four-sided box input with a link toggle for editing all sides at once. */
function SidesField({
  label,
  value,
  overridden,
  onChange,
  allowNegative = false,
}: {
  label: string;
  value: BoxSides | undefined;
  overridden?: boolean;
  onChange: (next: BoxSides | undefined) => void;
  allowNegative?: boolean;
}) {
  const sides = value || {};
  const allEqual =
    sides.top !== undefined &&
    sides.top === sides.right &&
    sides.top === sides.bottom &&
    sides.top === sides.left;
  const [linked, setLinked] = React.useState(allEqual || value === undefined);

  const setSide = (side: keyof BoxSides, raw: string) => {
    const num = raw === '' ? undefined : Number(raw);
    if (num !== undefined && !Number.isFinite(num)) return;

    if (linked) {
      onChange(num === undefined ? undefined : { top: num, right: num, bottom: num, left: num });
      return;
    }
    const next = { ...sides, [side]: num };
    const hasAny = (Object.keys(next) as (keyof BoxSides)[]).some(
      (key) => next[key] !== undefined
    );
    onChange(hasAny ? next : undefined);
  };

  const min = allowNegative ? -200 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <ThemedLabel className="flex items-center gap-1.5 text-xs font-medium">
          {label}
          {overridden && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-purple-500"
              title="Overridden at this breakpoint"
            />
          )}
        </ThemedLabel>
        <button
          type="button"
          onClick={() => setLinked((prev) => !prev)}
          title={linked ? 'Edit each side separately' : 'Link all sides'}
          className={`rounded p-1 transition-colors ${
            linked ? 'text-purple-600' : 'text-[var(--text-secondary)] hover:text-purple-600'
          }`}
        >
          {linked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
        </button>
      </div>

      {linked ? (
        <ThemedInput
          type="number"
          min={min}
          max={400}
          value={sides.top ?? ''}
          placeholder="0"
          onChange={(e) => setSide('top', e.target.value)}
        />
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side}>
              <ThemedInput
                type="number"
                min={min}
                max={400}
                value={sides[side] ?? ''}
                placeholder="0"
                onChange={(e) => setSide(side, e.target.value)}
              />
              <span className="mt-0.5 block text-center text-[10px] capitalize text-[var(--text-secondary)]">
                {side}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Breakpoint tab strip. Shown above the style editor so the user always knows
 * which layer they are editing; dots mark breakpoints that carry overrides.
 */
export function BreakpointTabs({
  value,
  onChange,
  responsive,
}: {
  value: BreakpointId;
  onChange: (id: BreakpointId) => void;
  responsive?: ResponsiveStyles;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-[var(--border)] p-1">
      {BREAKPOINTS.map((bp) => {
        const active = bp.id === value;
        const modified = bp.id !== BASE_BREAKPOINT && hasOverrides(responsive, bp.id);
        return (
          <button
            key={bp.id}
            type="button"
            onClick={() => onChange(bp.id)}
            title={bp.maxWidth ? `Up to ${bp.maxWidth}px wide` : 'Base layer (all widths)'}
            className={`relative flex-1 rounded px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
              active
                ? 'bg-purple-100 text-purple-700'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
            }`}
          >
            {bp.label}
            {modified && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
