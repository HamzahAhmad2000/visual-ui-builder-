'use client';

import { Check } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { Badge, Button, Label } from '../ui/primitives';
import {
  DEFAULT_VISUAL_UI_BUILDER_THEME,
  VISUAL_UI_BUILDER_PALETTES,
  type VisualUiBuilderPalette,
  type VisualUiBuilderTheme,
} from './tokens';

const BASIC_COLOR_FIELDS: Array<{
  key: keyof VisualUiBuilderTheme;
  label: string;
}> = [
  { key: 'background', label: 'Background' },
  { key: 'overlay', label: 'Dropdowns & Pickers' },
  { key: 'surface', label: 'Surface' },
  { key: 'surfaceMuted', label: 'Muted Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textMuted', label: 'Muted Text' },
  { key: 'border', label: 'Border' },
  { key: 'input', label: 'Input Border' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryHover', label: 'Primary Hover' },
  { key: 'accent', label: 'Accent' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
];

const paletteColors = (theme: VisualUiBuilderTheme) => [
  theme.background,
  theme.overlay,
  theme.surface,
  theme.surfaceMuted,
  theme.primary,
  theme.accent,
  theme.success,
  theme.warning,
  theme.error,
  theme.text,
];

const fieldPresetColors = (merged: VisualUiBuilderTheme, field: keyof VisualUiBuilderTheme) =>
  Array.from(
    new Set([
      merged[field],
      ...VISUAL_UI_BUILDER_PALETTES.flatMap((palette) => [
        palette.theme[field],
        palette.theme.primary,
        palette.theme.accent,
        palette.theme.surface,
        palette.theme.overlay,
      ]),
    ])
  );

const getActivePalette = (theme: VisualUiBuilderTheme, palettes: VisualUiBuilderPalette[]) =>
  palettes.find((palette) =>
    BASIC_COLOR_FIELDS.every((field) => palette.theme[field.key].toLowerCase() === theme[field.key].toLowerCase())
  );

export function BasicThemeEditor({
  value,
  onChange,
  palettes = VISUAL_UI_BUILDER_PALETTES,
}: {
  value: Partial<VisualUiBuilderTheme>;
  onChange: (next: Partial<VisualUiBuilderTheme>) => void;
  palettes?: VisualUiBuilderPalette[];
}) {
  const merged: VisualUiBuilderTheme = { ...DEFAULT_VISUAL_UI_BUILDER_THEME, ...value };
  const activePalette = getActivePalette(merged, palettes);

  const setColor = (key: keyof VisualUiBuilderTheme, color: string) => {
    onChange({ ...value, [key]: color.toUpperCase() });
  };

  return (
    <div className="vub-basic-theme-editor">
      <section className="vub-basic-theme-editor__palette">
        <div className="vub-basic-theme-editor__header">
          <div>
            <Label className="vub-basic-theme-editor__title">Palette</Label>
          </div>
          {activePalette && <Badge variant="secondary">{activePalette.label}</Badge>}
        </div>

        <div className="vub-basic-theme-editor__palette-grid">
          {palettes.map((palette) => {
            const active = palette.id === activePalette?.id;
            return (
              <Button
                key={palette.id}
                type="button"
                variant={active ? 'default' : 'outline'}
                className="vub-palette-option"
                aria-pressed={active}
                onClick={() => onChange(palette.theme)}
              >
                <span className="vub-palette-option__header">
                  <span>{palette.label}</span>
                  {active && <Check size={14} />}
                </span>
                <span className="vub-palette-option__swatches" aria-hidden="true">
                  {paletteColors(palette.theme).map((color, index) => (
                    <span
                      key={`${palette.id}-${color}-${index}`}
                      className="vub-palette-option__swatch"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="vub-basic-theme-editor__colors">
        <div className="vub-basic-theme-editor__header">
          <div>
            <Label className="vub-basic-theme-editor__title">Theme Colors</Label>
          </div>
        </div>

        <div className="vub-basic-theme-editor__fields">
          {BASIC_COLOR_FIELDS.map((field) => (
            <div key={field.key} className="vub-basic-theme-editor__field">
              <div className="vub-basic-theme-editor__field-copy">
                <Label>{field.label}</Label>
              </div>
              <ColorPicker
                value={merged[field.key]}
                onChange={(color) => setColor(field.key, color)}
                presetColors={fieldPresetColors(merged, field.key)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
