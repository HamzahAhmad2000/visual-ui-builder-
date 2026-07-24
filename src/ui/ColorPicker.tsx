'use client';

import React, { useMemo, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Button, Input } from './primitives';
import { cn } from './utils';

export const TRANSPARENT_VALUE = 'transparent';

export const isTransparent = (value: string | undefined | null) => {
  const v = (value ?? '').trim().toLowerCase();
  return v === 'transparent' || v === 'rgba(0,0,0,0)' || v === '#00000000';
};

export const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
  backgroundColor: '#ffffff',
};

const DEFAULT_PRESET_COLORS = [
  '#111827',
  '#FFFFFF',
  '#F8FAFC',
  '#E5E7EB',
  '#2563EB',
  '#7C3AED',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#64748B',
];

const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export function ColorPickerPanel({
  value,
  onChange,
  onSelect,
  presetColors = DEFAULT_PRESET_COLORS,
  allowTransparent = false,
}: {
  value: string;
  onChange: (color: string) => void;
  onSelect?: () => void;
  presetColors?: string[];
  allowTransparent?: boolean;
}) {
  const [customColor, setCustomColor] = useState(value);
  const colors = useMemo(() => Array.from(new Set(presetColors.map((item) => item.toUpperCase()))), [presetColors]);
  const transparentSelected = isTransparent(value);

  const choose = (color: string) => {
    onChange(color);
    setCustomColor(color);
    onSelect?.();
  };

  return (
    <div className="vub-color-panel">
      <div className="vub-color-panel__grid">
        {allowTransparent && (
          <button
            type="button"
            onClick={() => choose(TRANSPARENT_VALUE)}
            className="vub-color-swatch"
            style={CHECKERBOARD_STYLE}
            aria-label="Transparent"
          >
            {transparentSelected && <Check size={14} />}
          </button>
        )}
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => choose(color)}
            className="vub-color-swatch"
            style={{ backgroundColor: color }}
            aria-label={`Select ${color}`}
          >
            {value?.toLowerCase() === color.toLowerCase() && <Check size={14} />}
          </button>
        ))}
      </div>
      <div className="vub-color-panel__custom">
        <input
          className="vub-color-panel__native"
          type="color"
          value={isValidHex(customColor) ? customColor : '#000000'}
          onChange={(event) => {
            setCustomColor(event.target.value);
            onChange(event.target.value);
          }}
          aria-label="Custom color"
        />
        <Input
          value={customColor}
          onChange={(event) => {
            setCustomColor(event.target.value);
            if (isValidHex(event.target.value)) onChange(event.target.value);
          }}
          placeholder="#111827"
        />
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
  presetColors,
  label,
  className = '',
  disabled = false,
  allowTransparent = false,
}: {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  label?: string;
  className?: string;
  disabled?: boolean;
  allowTransparent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const transparent = isTransparent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('vub-color-picker', className)}
        >
          <span
            className="vub-color-picker__swatch"
            style={transparent ? CHECKERBOARD_STYLE : { backgroundColor: value }}
          />
          <Palette size={14} />
          <span>{label ? `${label}: ` : ''}{transparent ? 'Transparent' : value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="vub-color-picker__content" align="start">
        <ColorPickerPanel
          value={value}
          onChange={onChange}
          onSelect={() => setOpen(false)}
          presetColors={presetColors}
          allowTransparent={allowTransparent}
        />
      </PopoverContent>
    </Popover>
  );
}

export default ColorPicker;
