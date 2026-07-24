'use client';

import React, { useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import { ThemedButton } from '../ui/primitives';
import { BuilderShell, SettingsSection } from './BuilderShell';
import { ElementPalette, type DeviceMode } from './ElementPalette';
import { BlockCanvas } from './BlockCanvas';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { StyleEditor, BreakpointTabs } from './StyleEditor';
import type { TemplateVariable } from './VariablePicker';
import type { BaseProperties } from './styles';
import {
  createBlock,
  createLayoutRow,
  parseDocumentFromHtml,
  serializeBlocksToHtml,
  blocksToPlainText,
  findBlockById,
  updateBlockById,
  findColumnById,
  updateColumnById,
  type BuilderBlock,
} from './blocks';

interface ContentBuilderModalProps {
  open: boolean;
  /** Existing serialized HTML (from a previous builder session) to edit. */
  initialHtml?: string;
  title?: string;
  variables?: TemplateVariable[];
  uploadImage?: (file: File) => Promise<string>;
  onClose: () => void;
  /** Receives the serialized HTML plus a plain-text projection for search. */
  onSave: (html: string, plainText: string) => void;
}

/**
 * Full-screen overlay that hosts the shared content-builder (the same one used
 * by email templates, announcements, pop-up news and surveys) so any feature can
 * author rich HTML content with a consistent editor. A plain overlay is used
 * instead of a Radix dialog so the builder's own popovers (colour, font, etc.)
 * are not fighting the dialog's focus trap.
 */
export function ContentBuilderModal({
  open,
  initialHtml,
  title = 'Edit content',
  variables,
  uploadImage,
  onClose,
  onSave,
}: ContentBuilderModalProps) {
  const initialDocument = useMemo(() => parseDocumentFromHtml(initialHtml), [initialHtml]);

  const [blocks, setBlocks] = useState<BuilderBlock[]>(() =>
    initialDocument.blocks.length > 0
      ? initialDocument.blocks
      : [createBlock('text', { html: '<p></p>' })]
  );
  const [baseProperties, setBaseProperties] = useState<BaseProperties>(() => initialDocument.base);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceMode>('desktop');

  const selectedBlock = useMemo(
    () => (selectedBlockId ? findBlockById(blocks, selectedBlockId) : null),
    [blocks, selectedBlockId]
  );
  const selectedColumn = useMemo(
    () => (selectedColumnId ? findColumnById(blocks, selectedColumnId) : null),
    [blocks, selectedColumnId]
  );

  if (!open) return null;

  const handleSave = () => {
    const html = serializeBlocksToHtml(blocks, { wrap: true, base: baseProperties });
    onSave(html, blocksToPlainText(blocks));
    onClose();
  };

  const canvas = (
    <div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
      <BlockCanvas
        blocks={blocks}
        onBlocksChange={setBlocks}
        selectedId={selectedBlockId}
        onSelect={(id) => {
          setSelectedBlockId(id);
          if (id) setSelectedColumnId(null);
        }}
        selectedColumnId={selectedColumnId}
        onSelectColumn={(id) => {
          setSelectedColumnId(id);
          if (id) setSelectedBlockId(null);
        }}
        breakpoint={device}
        emptyTitle="Content"
        emptyHint="Drag and drop elements here to build your content"
      />
    </div>
  );

  const settings = selectedBlock || selectedColumn ? (
    <BlockSettingsPanel
      block={selectedBlock}
      column={selectedColumn}
      onUpdate={(next) => setBlocks((prev) => updateBlockById(prev, next.id, next))}
      onUpdateColumn={(next) => setBlocks((prev) => updateColumnById(prev, next.id, next))}
      onClose={() => {
        setSelectedBlockId(null);
        setSelectedColumnId(null);
      }}
      breakpoint={device}
      onBreakpointChange={setDevice}
      uploadImage={uploadImage}
      variables={variables}
    />
  ) : (
    <div className="space-y-3 p-4">
      <SettingsSection title="Base Properties">
        <p className="-mt-1 mb-1 text-[11px] text-[var(--text-secondary)]">
          Applies to the whole content block. Element-level spacing and borders are set on each
          element.
        </p>
        <BreakpointTabs value={device} onChange={setDevice} responsive={baseProperties.responsive} />
        <StyleEditor
          variant="base"
          style={baseProperties.style}
          responsive={baseProperties.responsive}
          breakpoint={device}
          onChange={(layers) =>
            setBaseProperties({
              style: layers.style || {},
              responsive: layers.responsive || {},
            })
          }
        />
      </SettingsSection>
      <p className="px-1 text-[11px] text-[var(--text-secondary)]">
        Select an element in the canvas to edit its content and style.
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10050] flex flex-col bg-[var(--background)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <div className="flex items-center gap-2">
          <ThemedButton type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </ThemedButton>
          <ThemedButton type="button" size="sm" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            Save Content
          </ThemedButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <BuilderShell
          device={device}
          canvasLabel="Content Preview"
          palette={
            <ElementPalette
              device={device}
              onDeviceChange={setDevice}
              onAddElement={(type) => {
                const block = createBlock(type);
                setBlocks((prev) => [...prev, block]);
                setSelectedBlockId(block.id);
                setSelectedColumnId(null);
              }}
              onAddLayout={(columns) => {
                const row = createLayoutRow(columns);
                setBlocks((prev) => [...prev, row]);
                setSelectedBlockId(row.id);
                setSelectedColumnId(null);
              }}
            />
          }
          canvas={canvas}
          settings={settings}
        />
      </div>
    </div>
  );
}

export default ContentBuilderModal;
