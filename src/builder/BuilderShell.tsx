'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DeviceMode } from './ElementPalette';
import { getBreakpoint } from './styles';

/** Collapsible card used for grouped feature settings in the right panel. */
export function SettingsSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[var(--border-radius-boxes-md)] border border-[var(--border)] bg-[var(--background)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
        )}
      </button>
      {open && (
        <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">{children}</div>
      )}
    </div>
  );
}

interface BuilderShellProps {
  /** Left panel content (usually an <ElementPalette />). */
  palette: React.ReactNode;
  /** Middle canvas content. */
  canvas: React.ReactNode;
  /** Right panel content (feature settings or <BlockSettingsPanel />). */
  settings: React.ReactNode;
  /** Optional toolbar row rendered above the three panels. */
  toolbar?: React.ReactNode;
  device?: DeviceMode;
  canvasLabel?: string;
}

/**
 * Three-panel builder layout (elements | canvas | settings) matching the
 * reference Email-Template-Builder: white side panels, muted canvas area,
 * each panel scrolling independently so the preview effectively stays sticky.
 */
export function BuilderShell({
  palette,
  canvas,
  settings,
  toolbar,
  device = 'desktop',
  canvasLabel = 'Canvas',
}: BuilderShellProps) {
  return (
    <div className="flex h-[calc(100vh-190px)] min-h-[560px] flex-col overflow-hidden rounded-[var(--border-radius-lg)] border border-[var(--border)] bg-[var(--background)]">
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
          {toolbar}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(18rem,1.4fr)_minmax(16rem,1fr)] xl:grid-cols-[minmax(14rem,18rem)_minmax(20rem,1fr)_minmax(18rem,24rem)]">
        {/* Left: element palette */}
        <div className="min-w-0 overflow-y-auto border-b border-[var(--border)] bg-[var(--background)] lg:border-b-0 lg:border-r">
          {palette}
        </div>

        {/* Middle: canvas — framed to the active breakpoint's preview width */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-[var(--background-secondary,var(--surface))] p-6">
          <div
            className="mx-auto w-full transition-all duration-300"
            style={{ maxWidth: getBreakpoint(device).previewWidth }}
          >
            <h2 className="mb-4 flex items-center text-lg font-bold text-[var(--text-primary)]">
              {canvasLabel}
              <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
                ({getBreakpoint(device).label} view)
              </span>
            </h2>
            {canvas}
          </div>
        </div>

        {/* Right: settings */}
        <div className="min-w-0 overflow-y-auto border-t border-[var(--border)] bg-[var(--background)] lg:border-l lg:border-t-0">
          {settings}
        </div>
      </div>
    </div>
  );
}
