'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, ImageIcon, MousePointerClick } from 'lucide-react';
import {
  BASE_BREAKPOINT,
  resolveStyle,
  type BreakpointId,
  type BuilderBlock,
  type LayoutRowColumn,
  createBlock,
  createLayoutRow,
  insertBlockIntoColumnById,
  removeBlockById,
  renderBlockToHtml,
} from './blocks';
import { PALETTE_MIME, type PaletteDragPayload } from './ElementPalette';

interface BlockCanvasProps {
  blocks: BuilderBlock[];
  onBlocksChange: (blocks: BuilderBlock[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Currently selected layout column, if any. */
  selectedColumnId?: string | null;
  onSelectColumn?: (columnId: string | null) => void;
  /** Breakpoint layer the canvas is previewing. */
  breakpoint?: BreakpointId;
  /** Copy shown in the empty drop zone. */
  emptyTitle?: string;
  emptyHint?: string;
}

const parsePalettePayload = (e: React.DragEvent): PaletteDragPayload | null => {
  try {
    const raw = e.dataTransfer.getData(PALETTE_MIME);
    if (!raw) return null;
    const data = JSON.parse(raw) as PaletteDragPayload;
    if (data.kind !== 'element' && data.kind !== 'layout') return null;
    return data;
  } catch {
    return null;
  }
};

const buildBlockFromPayload = (payload: PaletteDragPayload): BuilderBlock | null => {
  if (payload.kind === 'layout') return createLayoutRow(payload.columns || 2);
  if (payload.blockType) return createBlock(payload.blockType);
  return null;
};

function DropZone({ onDropBlock }: { onDropBlock: (block: BuilderBlock) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(PALETTE_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const payload = parsePalettePayload(e);
        const block = payload && buildBlockFromPayload(payload);
        if (block) onDropBlock(block);
      }}
      className={`rounded transition-all duration-150 ${
        over
          ? 'my-1 flex h-10 items-center justify-center border-2 border-dashed border-purple-500 bg-purple-50 text-xs font-medium text-purple-600'
          : 'h-2'
      }`}
    >
      {over ? 'Drop here' : null}
    </div>
  );
}

/** Static, WYSIWYG rendering of a single block using its final HTML output. */
function BlockPreview({
  block,
  breakpoint = BASE_BREAKPOINT,
}: {
  block: BuilderBlock;
  breakpoint?: BreakpointId;
}) {
  if (block.type === 'image' && !block.src.trim()) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
        <ImageIcon className="h-6 w-6" />
        <span className="text-xs">Select this block and upload an image</span>
      </div>
    );
  }
  if (block.type === 'spacer') {
    return (
      <div
        className="rounded border border-dashed border-[var(--border)]/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(139,92,246,0.06)_6px,rgba(139,92,246,0.06)_12px)]"
        style={{ height: block.height }}
        title={`Spacer (${block.height}px)`}
      />
    );
  }
  return (
    <div dangerouslySetInnerHTML={{ __html: renderBlockToHtml(block, undefined, breakpoint) }} />
  );
}

/**
 * Interactive layout-row preview.
 *
 * Recursive: a column may itself hold layout rows, which is what makes columns
 * embeddable. Columns are selectable in their own right — clicking the column
 * chrome (not an element inside it) opens its style settings.
 */
function LayoutRowPreview({
  block,
  selectedId,
  onSelect,
  selectedColumnId,
  onSelectColumn,
  onDropIntoColumn,
  onRemoveNested,
  breakpoint = BASE_BREAKPOINT,
}: {
  block: Extract<BuilderBlock, { type: 'layout_row' }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedColumnId?: string | null;
  onSelectColumn?: (columnId: string | null) => void;
  onDropIntoColumn: (columnId: string, newBlock: BuilderBlock) => void;
  onRemoveNested: (id: string) => void;
  breakpoint?: BreakpointId;
}) {
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const rowStyle = resolveStyle(block.style, block.responsive, breakpoint);
  const stacked = rowStyle.stack === 'vertical';
  const gap = block.gap ?? 8;

  const columnStyle = (col: LayoutRowColumn): React.CSSProperties => {
    const resolved = resolveStyle(col.style, col.responsive, breakpoint);
    return {
      backgroundColor: resolved.backgroundColor,
      borderRadius: resolved.borderRadius,
      opacity: resolved.hidden ? 0.4 : undefined,
    };
  };

  return (
    <div
      className="grid"
      style={{
        gap,
        gridTemplateColumns: stacked
          ? '1fr'
          : block.columns.map((col) => `${col.weight ?? 1}fr`).join(' '),
      }}
    >
      {block.columns.map((col, index) => {
        const isColumnSelected = selectedColumnId === col.id;
        return (
          <div
            key={col.id}
            data-column-dropzone
            onClick={(e) => {
              // Only claim the click when it landed on the column itself,
              // otherwise selecting a nested element would be impossible.
              if (e.target !== e.currentTarget) return;
              e.stopPropagation();
              onSelectColumn?.(col.id);
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(PALETTE_MIME)) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
                setOverColumn(col.id);
              }
            }}
            onDragLeave={() => setOverColumn((prev) => (prev === col.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOverColumn(null);
              const payload = parsePalettePayload(e);
              if (!payload) return;
              // Layouts are allowed here too, which is what nests columns.
              const newBlock = buildBlockFromPayload(payload);
              if (newBlock) onDropIntoColumn(col.id, newBlock);
            }}
            style={columnStyle(col)}
            className={`relative min-h-[72px] cursor-pointer rounded-md border-2 border-dashed p-2 transition-colors ${
              overColumn === col.id
                ? 'border-purple-500 bg-purple-50/50'
                : isColumnSelected
                  ? 'border-purple-500 ring-2 ring-purple-400'
                  : 'border-[var(--border)]/70 hover:border-purple-300'
            }`}
          >
            <span className="pointer-events-none absolute left-1.5 top-1 text-[10px] font-medium text-[var(--text-muted)]">
              {index + 1}
            </span>

            {col.elements.length === 0 && (
              <p className="pointer-events-none py-4 text-center text-[11px] text-[var(--text-muted)]">
                Drop elements here
              </p>
            )}

            {col.elements.map((el) => {
              const elStyle = resolveStyle(el.style, el.responsive, breakpoint);
              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(el.id);
                  }}
                  style={{ opacity: elStyle.hidden ? 0.4 : undefined }}
                  className={`group/nested relative cursor-pointer rounded p-1 transition-shadow ${
                    selectedId === el.id
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-purple-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveNested(el.id);
                    }}
                    className="absolute -right-1 -top-1 z-10 hidden rounded-full bg-red-500 p-0.5 text-white group-hover/nested:block"
                    aria-label="Delete element"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  {el.type === 'layout_row' ? (
                    <LayoutRowPreview
                      block={el}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      selectedColumnId={selectedColumnId}
                      onSelectColumn={onSelectColumn}
                      onDropIntoColumn={onDropIntoColumn}
                      onRemoveNested={onRemoveNested}
                      breakpoint={breakpoint}
                    />
                  ) : (
                    <BlockPreview block={el} breakpoint={breakpoint} />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function SortableCanvasBlock({
  block,
  selectedId,
  onSelect,
  selectedColumnId,
  onSelectColumn,
  onDuplicate,
  onRemove,
  onDropIntoColumn,
  onRemoveNested,
  breakpoint = BASE_BREAKPOINT,
}: {
  block: BuilderBlock;
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedColumnId?: string | null;
  onSelectColumn?: (columnId: string | null) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onDropIntoColumn: (columnId: string, newBlock: BuilderBlock) => void;
  onRemoveNested: (id: string) => void;
  breakpoint?: BreakpointId;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const isSelected = selectedId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      className={`group relative rounded-md transition-shadow ${isDragging ? 'opacity-60' : ''} ${
        isSelected
          ? 'ring-2 ring-purple-500 ring-offset-2'
          : 'hover:ring-1 hover:ring-purple-300 hover:ring-offset-1'
      }`}
    >
      {/* Hover / selection toolbar */}
      <div
        className={`absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-1 py-0.5 shadow-sm ${
          isSelected ? 'flex' : 'hidden group-hover:flex'
        }`}
      >
        <button
          type="button"
          className="cursor-grab p-1 text-[var(--text-muted)] hover:text-purple-600 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          }}
          className="p-1 text-[var(--text-muted)] hover:text-purple-600"
          aria-label="Duplicate block"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
          className="p-1 text-[var(--text-muted)] hover:text-red-600"
          aria-label="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-1">
        {block.type === 'layout_row' ? (
          <LayoutRowPreview
            block={block}
            selectedId={selectedId}
            onSelect={onSelect}
            selectedColumnId={selectedColumnId}
            onSelectColumn={onSelectColumn}
            onDropIntoColumn={onDropIntoColumn}
            onRemoveNested={onRemoveNested}
            breakpoint={breakpoint}
          />
        ) : (
          <BlockPreview block={block} breakpoint={breakpoint} />
        )}
      </div>
    </div>
  );
}

/**
 * Middle panel of the builder: renders blocks exactly as they will be saved
 * (same HTML renderer), with click-to-select, drag-to-reorder, and drop zones
 * for elements dragged from the palette.
 */
export function BlockCanvas({
  blocks,
  onBlocksChange,
  selectedId,
  onSelect,
  selectedColumnId = null,
  onSelectColumn,
  breakpoint = BASE_BREAKPOINT,
  emptyTitle = 'Drop Zone',
  emptyHint = 'Drag and drop elements here to build your content',
}: BlockCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const insertAt = (index: number, block: BuilderBlock) => {
    const next = [...blocks];
    next.splice(index, 0, block);
    onBlocksChange(next);
    onSelect(block.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((item) => item.id === active.id);
    const newIndex = blocks.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const handleDuplicate = (id: string) => {
    const index = blocks.findIndex((item) => item.id === id);
    if (index < 0) return;
    const duplicated = createBlock(blocks[index].type, { ...blocks[index] });
    insertAt(index + 1, duplicated);
  };

  const handleRemove = (id: string) => {
    onBlocksChange(removeBlockById(blocks, id));
    if (selectedId === id) onSelect(null);
  };

  return (
    <div
      onClick={() => {
        onSelect(null);
        onSelectColumn?.(null);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(PALETTE_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const payload = parsePalettePayload(e);
        const block = payload && buildBlockFromPayload(payload);
        if (block) {
          onBlocksChange([...blocks, block]);
          onSelect(block.id);
        }
      }}
      className="min-h-[220px]"
    >
      {blocks.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] transition-colors hover:border-purple-400 hover:bg-purple-50/20">
          <div className="p-6 text-center">
            <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-purple-400" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{emptyTitle}</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{emptyHint}</p>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={blocks.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                  <DropZone onDropBlock={(newBlock) => insertAt(index, newBlock)} />
                  <SortableCanvasBlock
                    block={block}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    selectedColumnId={selectedColumnId}
                    onSelectColumn={onSelectColumn}
                    onDuplicate={handleDuplicate}
                    onRemove={handleRemove}
                    onDropIntoColumn={(columnId, newBlock) => {
                      onBlocksChange(insertBlockIntoColumnById(blocks, columnId, newBlock));
                      onSelect(newBlock.id);
                    }}
                    onRemoveNested={handleRemove}
                    breakpoint={breakpoint}
                  />
                </React.Fragment>
              ))}
              <DropZone onDropBlock={(newBlock) => insertAt(blocks.length, newBlock)} />
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
