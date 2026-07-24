'use client';

import React from 'react';
import {
  Square,
  Columns,
  Grid3X3,
  Type,
  Heading1,
  Image as ImageIcon,
  Hash,
  Minus,
  MessageCircle,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Link2,
  Space,
} from 'lucide-react';
import type { BuilderBlockType } from './blocks';
import { BREAKPOINTS, type BreakpointId } from './styles';

/**
 * The breakpoint the builder is previewing. Widened from the original
 * desktop/mobile pair — existing callers passing either still typecheck.
 */
export type DeviceMode = BreakpointId;

const BREAKPOINT_ICONS: Record<BreakpointId, React.ReactNode> = {
  desktop: <Monitor size={15} />,
  laptop: <Laptop size={15} />,
  tablet: <Tablet size={15} />,
  mobile: <Smartphone size={15} />,
};

export interface PaletteDragPayload {
  kind: 'element' | 'layout';
  blockType?: BuilderBlockType;
  columns?: number;
}

export const PALETTE_MIME = 'application/json';

const LAYOUTS: { name: string; columns: number; icon: React.ReactNode }[] = [
  { name: 'Column', columns: 1, icon: <Square size={22} /> },
  { name: '2 Column', columns: 2, icon: <Columns size={22} /> },
  { name: '3 Column', columns: 3, icon: <Grid3X3 size={22} /> },
  { name: '4 Column', columns: 4, icon: <Grid3X3 size={22} /> },
];

const ELEMENTS: { name: string; type: BuilderBlockType; icon: React.ReactNode }[] = [
  { name: 'Heading', type: 'heading', icon: <Heading1 size={20} /> },
  { name: 'Text', type: 'text', icon: <Type size={20} /> },
  { name: 'Button', type: 'button', icon: <Link2 size={20} /> },
  { name: 'Image', type: 'image', icon: <ImageIcon size={20} /> },
  { name: 'Divider', type: 'divider', icon: <Minus size={20} /> },
  { name: 'Spacer', type: 'spacer', icon: <Space size={20} /> },
  { name: 'Social Icon', type: 'social_icon', icon: <MessageCircle size={20} /> },
  { name: 'HTML Block', type: 'html', icon: <Hash size={20} /> },
];

interface ElementPaletteProps {
  device: DeviceMode;
  onDeviceChange: (device: DeviceMode) => void;
  onAddElement: (type: BuilderBlockType) => void;
  onAddLayout: (columns: number) => void;
  /** Hide the layout section for compact surfaces (e.g. the announcement bar). */
  showLayouts?: boolean;
  /** Hide the device toggle for fixed-width surfaces. */
  showDeviceToggle?: boolean;
  /** Restrict which elements are offered. */
  elementTypes?: BuilderBlockType[];
}

function PaletteItem({
  payload,
  onClick,
  children,
}: {
  payload: PaletteDragPayload;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_MIME, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-grab rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--background)] p-4 transition-all duration-300 hover:border-purple-400 hover:bg-purple-50/20 active:cursor-grabbing"
    >
      {children}
    </div>
  );
}

/**
 * Left panel of the builder: draggable (or click-to-add) layout and element
 * tiles, visually matching the reference Email-Template-Builder sidebar.
 */
export function ElementPalette({
  device,
  onDeviceChange,
  onAddElement,
  onAddLayout,
  showLayouts = true,
  showDeviceToggle = true,
  elementTypes,
}: ElementPaletteProps) {
  const elements = elementTypes
    ? ELEMENTS.filter((element) => elementTypes.includes(element.type))
    : ELEMENTS;

  return (
    <div className="p-5">
      {showDeviceToggle && (
        <div className="mb-6 border-b border-[var(--border)] pb-4">
          <div className="grid grid-cols-2 gap-1.5">
            {BREAKPOINTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => onDeviceChange(bp.id)}
                title={bp.maxWidth ? `Up to ${bp.maxWidth}px wide` : 'Base layer (all widths)'}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 transition-all duration-300 ${
                  device === bp.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                {BREAKPOINT_ICONS[bp.id]}
                <span className="text-xs font-medium">{bp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showLayouts && (
        <div className="mb-8">
          <h3 className="mb-4 flex items-center text-base font-semibold text-[var(--text-primary)]">
            <span>Layouts</span>
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
              Drag &amp; Drop
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {LAYOUTS.map((layout) => (
              <PaletteItem
                key={layout.name}
                payload={{ kind: 'layout', columns: layout.columns }}
                onClick={() => onAddLayout(layout.columns)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 flex justify-center text-[var(--text-secondary)] transition-all duration-300 group-hover:scale-110 group-hover:text-purple-600 group-hover:drop-shadow-lg">
                    {layout.icon}
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{layout.name}</div>
                </div>
              </PaletteItem>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-4 flex items-center text-base font-semibold text-[var(--text-primary)]">
          <span>Elements</span>
          <span className="ml-2 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
            Drag &amp; Drop
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {elements.map((element) => (
            <PaletteItem
              key={element.name}
              payload={{ kind: 'element', blockType: element.type }}
              onClick={() => onAddElement(element.type)}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="text-[var(--text-secondary)] transition-all duration-300 group-hover:scale-110 group-hover:text-purple-600 group-hover:drop-shadow-lg">
                  {element.icon}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{element.name}</span>
              </div>
            </PaletteItem>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Drag items into the canvas, or click to add them at the end.
      </p>
    </div>
  );
}
