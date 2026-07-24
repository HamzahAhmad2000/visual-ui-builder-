'use client';

import React from 'react';
import { ArrowLeft, MousePointerClick } from 'lucide-react';
import { ThemedInput } from '../ui/primitives';
import { ThemedTextarea } from '../ui/primitives';
import { ThemedButton } from '../ui/primitives';
import { ThemedLabel } from '../ui/primitives';
import { ThemedSwitch } from '../ui/primitives';
import {
  ThemedSelect,
  ThemedSelectContent,
  ThemedSelectItem,
  ThemedSelectTrigger,
  ThemedSelectValue,
} from '../ui/primitives';
import { ColorPicker } from '../ui/ColorPicker';
import { RichTextEditor, type RichTextEditorHandle } from '../ui/RichTextEditor';
import { ImageUploadField } from './ImageUploadField';
import { InternalLinkSelect, type InternalPageOption } from './InternalLinkSelect';
import { SettingsSection } from './BuilderShell';
import { StyleEditor, BreakpointTabs, type StyleLayers } from './StyleEditor';
import { VariablePicker, type TemplateVariable } from './VariablePicker';
import {
  BASE_BREAKPOINT,
  BLOCK_LABELS,
  createColumn,
  SOCIAL_ICON_OPTIONS,
  type Align,
  type BreakpointId,
  type BuilderBlock,
  type LayoutRowColumn,
  type SocialIconType,
} from './blocks';

const ALIGN_OPTIONS: { label: string; value: Align }[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

function AlignField({ value, onChange }: { value: Align; onChange: (align: Align) => void }) {
  return (
    <div className="flex gap-1.5">
      {ALIGN_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
            value === option.value
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <ThemedLabel className="text-xs font-medium">{label}</ThemedLabel>
      {children}
    </div>
  );
}

/**
 * Caret tracking for a plain <input>, so variables land where the user left the
 * cursor instead of being appended. Mirrors RichTextEditor.insertAtCursor.
 */
function useInputCaret(value: string, onChange: (next: string) => void) {
  const ref = React.useRef<HTMLInputElement>(null);
  const caretRef = React.useRef<number | null>(null);

  const save = React.useCallback(() => {
    caretRef.current = ref.current?.selectionStart ?? null;
  }, []);

  const insert = React.useCallback(
    (text: string) => {
      const position = caretRef.current ?? value.length;
      const next = `${value.slice(0, position)}${text}${value.slice(position)}`;
      onChange(next);

      const caret = position + text.length;
      caretRef.current = caret;
      // The input is controlled, so restore focus/selection after React commits.
      requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(caret, caret);
      });
    },
    [value, onChange]
  );

  return { ref, save, insert };
}

/** Text input paired with a variable picker that inserts at the caret. */
function VariableTextField({
  label,
  value,
  onChange,
  variables,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  variables?: TemplateVariable[];
  placeholder?: string;
}) {
  const caret = useInputCaret(value, onChange);
  return (
    <>
      <Field label={label}>
        <ThemedInput
          ref={caret.ref}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={caret.save}
          onMouseUp={caret.save}
          onBlur={caret.save}
        />
      </Field>
      {variables && variables.length > 0 && (
        <Field label="Insert Variable">
          <VariablePicker
            variables={variables}
            onInsert={caret.insert}
            hint="Click to insert at the cursor."
          />
        </Field>
      )}
    </>
  );
}

interface BlockSettingsPanelProps {
  block: BuilderBlock | null;
  /** Set instead of `block` when a layout column is selected. */
  column?: LayoutRowColumn | null;
  onUpdate: (next: BuilderBlock) => void;
  onUpdateColumn?: (next: LayoutRowColumn) => void;
  onClose: () => void;
  /**
   * Breakpoint layer currently being edited. Omit on surfaces that do not
   * expose breakpoints (announcements, pop-up news) — the editor then edits
   * the base layer only and the breakpoint tabs stay hidden.
   */
  breakpoint?: BreakpointId;
  onBreakpointChange?: (breakpoint: BreakpointId) => void;
  /** Upload handler used by image blocks; resolves to the stored URL. */
  uploadImage?: (file: File) => Promise<string>;
  /** Extra internal-link options for button URLs (e.g. surveys). */
  linkExtraOptions?: InternalPageOption[];
  /** Optional pop-up targets for button blocks on announcement surfaces. */
  popupOptions?: Array<{ id: number; title: string }>;
  /** Merge-field catalog; enables click-to-insert in text-bearing blocks. */
  variables?: TemplateVariable[];
}

/**
 * Right panel of the builder while an element or column is selected.
 *
 * Settings are split the way the spec asks: **Content** is shared across every
 * breakpoint, while **Layout & Style** edits only the active breakpoint layer.
 */
export function BlockSettingsPanel({
  block,
  column,
  onUpdate,
  onUpdateColumn,
  onClose,
  breakpoint = BASE_BREAKPOINT,
  onBreakpointChange,
  uploadImage,
  linkExtraOptions,
  popupOptions,
  variables,
}: BlockSettingsPanelProps) {
  const richTextRef = React.useRef<RichTextEditorHandle>(null);
  // Tabs only make sense when the host can actually switch breakpoints.
  const showBreakpoints = Boolean(onBreakpointChange);

  // A selected column takes precedence: it has style layers but no content.
  if (column && onUpdateColumn) {
    return (
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Column Settings</h3>
          <ThemedButton type="button" variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Done
          </ThemedButton>
        </div>

        {showBreakpoints && onBreakpointChange && (
          <BreakpointTabs
            value={breakpoint}
            onChange={onBreakpointChange}
            responsive={column.responsive}
          />
        )}

        <Field label={`Width Weight: ${column.weight ?? 1}`}>
          <input
            type="range"
            min={1}
            max={12}
            value={column.weight ?? 1}
            onChange={(e) => onUpdateColumn({ ...column, weight: Number(e.target.value) })}
            className="w-full"
          />
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Relative to sibling columns — two columns weighted 3 and 1 split 75% / 25%.
          </p>
        </Field>

        <SettingsSection title="Layout & Style">
          <StyleEditor
            style={column.style}
            responsive={column.responsive}
            breakpoint={breakpoint}
            onChange={(layers: StyleLayers) =>
              onUpdateColumn({ ...column, style: layers.style, responsive: layers.responsive })
            }
          />
        </SettingsSection>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="p-6 text-center text-[var(--text-secondary)]">
        <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-purple-400" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Element Selected</h3>
        <p className="mt-1 text-xs">Click any element in the canvas to edit its settings here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {BLOCK_LABELS[block.type]} Settings
        </h3>
        <ThemedButton type="button" variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Done
        </ThemedButton>
      </div>

      {showBreakpoints && onBreakpointChange && (
        <BreakpointTabs
          value={breakpoint}
          onChange={onBreakpointChange}
          responsive={block.responsive}
        />
      )}

      <SettingsSection title="Content">
      <p className="-mt-1 mb-1 text-[11px] text-[var(--text-secondary)]">
        Shared across all breakpoints.
      </p>

      {block.type === 'heading' && (
        <>
          <VariableTextField
            label="Heading Text"
            value={block.text}
            onChange={(text) => onUpdate({ ...block, text })}
            variables={variables}
          />
          <Field label="Level">
            <ThemedSelect
              value={String(block.level)}
              onValueChange={(value) =>
                onUpdate({
                  ...block,
                  level: value === '1' || value === '3' ? (Number(value) as 1 | 3) : 2,
                })
              }
            >
              <ThemedSelectTrigger>
                <ThemedSelectValue />
              </ThemedSelectTrigger>
              <ThemedSelectContent>
                <ThemedSelectItem value="1">H1 — Large</ThemedSelectItem>
                <ThemedSelectItem value="2">H2 — Medium</ThemedSelectItem>
                <ThemedSelectItem value="3">H3 — Small</ThemedSelectItem>
              </ThemedSelectContent>
            </ThemedSelect>
          </Field>
          <Field label="Alignment">
            <AlignField value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
          </Field>
          <Field label="Text Color">
            <ColorPicker value={block.color} onChange={(color) => onUpdate({ ...block, color })} allowTransparent />
          </Field>
        </>
      )}

      {block.type === 'text' && (
        <>
          <Field label="Text Content">
            <RichTextEditor
              ref={richTextRef}
              value={block.html}
              onChange={(html) => onUpdate({ ...block, html })}
              minHeight="180px"
              placeholder="Enter your text here..."
            />
          </Field>
          {variables && variables.length > 0 && (
            <Field label="Insert Variable">
              <VariablePicker
                variables={variables}
                onInsert={(placeholder) => richTextRef.current?.insertAtCursor(placeholder)}
                hint="Click to insert at the cursor. Place the cursor in the text above first."
              />
            </Field>
          )}
        </>
      )}

      {block.type === 'image' && (
        <>
          <Field label="Image">
            {uploadImage ? (
              <ImageUploadField
                value={block.src || null}
                onChange={(url) => onUpdate({ ...block, src: url || '' })}
                upload={uploadImage}
              />
            ) : (
              <ThemedInput
                value={block.src}
                onChange={(e) => onUpdate({ ...block, src: e.target.value })}
                placeholder="https://..."
              />
            )}
          </Field>
          <Field label="Image URL">
            <ThemedInput
              value={block.src}
              onChange={(e) => onUpdate({ ...block, src: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Alt Text">
            <ThemedInput
              value={block.alt}
              onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (px)">
              <ThemedInput
                type="number"
                value={String(block.width)}
                onChange={(e) =>
                  onUpdate({
                    ...block,
                    width: Math.max(40, Math.min(700, Number(e.target.value || 320))),
                  })
                }
              />
            </Field>
            <Field label="Height (px)">
              <ThemedInput
                type="number"
                value={String(block.height)}
                onChange={(e) =>
                  onUpdate({
                    ...block,
                    height: Math.max(40, Math.min(700, Number(e.target.value || 220))),
                  })
                }
              />
            </Field>
          </div>
          <Field label="Alignment">
            <AlignField value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
          </Field>
          <Field label={`Corner Radius: ${block.borderRadius}px`}>
            <input
              type="range"
              min={0}
              max={48}
              value={block.borderRadius}
              onChange={(e) => onUpdate({ ...block, borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}

      {block.type === 'button' && (
        <>
          <VariableTextField
            label="Button Text"
            value={block.text}
            onChange={(text) => onUpdate({ ...block, text })}
            variables={variables}
            placeholder="Click Here"
          />
          <Field label="Link">
            <InternalLinkSelect
              value={block.url}
              onChange={(url) => onUpdate({ ...block, url })}
              extraOptions={linkExtraOptions}
            />
          </Field>
          {popupOptions && (
            <Field label="Open Pop-Up">
              <select
                value={block.popupId ?? ''}
                onChange={(event) =>
                  onUpdate({
                    ...block,
                    popupId: event.target.value ? Number(event.target.value) : null,
                  })
                }
                className="h-10 w-full rounded-[var(--border-radius-fields-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">No pop-up trigger</option>
                {popupOptions.map((popup) => (
                  <option key={popup.id} value={popup.id}>
                    {popup.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                If selected, this button opens the pop-up instead of navigating to the URL.
              </p>
            </Field>
          )}
          <Field label="Alignment">
            <AlignField value={block.align} onChange={(align) => onUpdate({ ...block, align })} />
          </Field>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Background Color">
              <ColorPicker
                value={block.backgroundColor}
                onChange={(backgroundColor) => onUpdate({ ...block, backgroundColor })}
                allowTransparent
              />
            </Field>
            <Field label="Text Color">
              <ColorPicker
                value={block.textColor}
                onChange={(textColor) => onUpdate({ ...block, textColor })}
                allowTransparent
              />
            </Field>
          </div>
          <Field label={`Corner Radius: ${block.borderRadius}px`}>
            <input
              type="range"
              min={0}
              max={48}
              value={block.borderRadius}
              onChange={(e) => onUpdate({ ...block, borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <div className="flex items-center gap-2">
            <ThemedSwitch
              id={`button-full-width-${block.id}`}
              checked={block.fullWidth}
              onCheckedChange={(checked) => onUpdate({ ...block, fullWidth: checked === true })}
            />
            <ThemedLabel htmlFor={`button-full-width-${block.id}`} className="text-xs">
              Full width
            </ThemedLabel>
          </div>
        </>
      )}

      {block.type === 'divider' && (
        <Field label="Divider Color">
          <ColorPicker value={block.color} onChange={(color) => onUpdate({ ...block, color })} />
        </Field>
      )}

      {block.type === 'spacer' && (
        <Field label={`Height: ${block.height}px`}>
          <input
            type="range"
            min={4}
            max={160}
            value={block.height}
            onChange={(e) => onUpdate({ ...block, height: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}

      {block.type === 'html' && (
        <Field label="Custom HTML">
          <ThemedTextarea
            value={block.html}
            onChange={(e) => onUpdate({ ...block, html: e.target.value })}
            rows={10}
            className="font-mono text-xs"
          />
        </Field>
      )}

      {block.type === 'social_icon' && (
        <>
          <Field label="Platform">
            <ThemedSelect
              value={block.socialIcon}
              onValueChange={(value) =>
                onUpdate({ ...block, socialIcon: value as SocialIconType })
              }
            >
              <ThemedSelectTrigger>
                <ThemedSelectValue />
              </ThemedSelectTrigger>
              <ThemedSelectContent>
                {SOCIAL_ICON_OPTIONS.map((option) => (
                  <ThemedSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </ThemedSelectItem>
                ))}
              </ThemedSelectContent>
            </ThemedSelect>
          </Field>
          <Field label="URL">
            <ThemedInput
              value={block.socialUrl}
              onChange={(e) => onUpdate({ ...block, socialUrl: e.target.value })}
              placeholder="https://instagram.com/your-page"
            />
          </Field>
          <Field label="Icon Color">
            <ColorPicker
              value={block.socialColor}
              onChange={(socialColor) => onUpdate({ ...block, socialColor })}
              allowTransparent
            />
          </Field>
          <Field label={`Icon Size: ${block.socialSize}px`}>
            <input
              type="range"
              min={16}
              max={64}
              value={block.socialSize}
              onChange={(e) => onUpdate({ ...block, socialSize: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}

      {block.type === 'layout_row' && (
        <Field label={`Columns: ${block.columns.length}`}>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((count) => (
              <ThemedButton
                key={count}
                type="button"
                size="sm"
                variant={block.columns.length === count ? 'default' : 'outline'}
                onClick={() => {
                  const current = block.columns;
                  const columns =
                    count > current.length
                      ? [
                          ...current,
                          ...Array.from({ length: count - current.length }, () =>
                            createColumn()
                          ),
                        ]
                      : current.slice(0, count);
                  onUpdate({ ...block, columns });
                }}
              >
                {count}
              </ThemedButton>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Reducing the column count removes trailing columns and their content.
          </p>
        </Field>
      )}

      {block.type === 'layout_row' && (
        <Field label={`Column Gap: ${block.gap ?? 8}px`}>
          <input
            type="range"
            min={0}
            max={64}
            value={block.gap ?? 8}
            onChange={(e) => onUpdate({ ...block, gap: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}
      </SettingsSection>

      <SettingsSection title="Layout & Style">
        <StyleEditor
          style={block.style}
          responsive={block.responsive}
          breakpoint={breakpoint}
          onChange={(layers: StyleLayers) =>
            onUpdate({ ...block, style: layers.style, responsive: layers.responsive })
          }
          showStacking={block.type === 'layout_row'}
        />
      </SettingsSection>
    </div>
  );
}
