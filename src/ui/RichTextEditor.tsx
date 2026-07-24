'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Bold, Highlighter, Italic, Palette, Type, Underline } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { ColorPickerPanel } from './ColorPicker';

const FONT_SIZES = [
  { value: '1', label: 'Small' },
  { value: '2', label: 'Smaller' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Medium' },
  { value: '5', label: 'Large' },
  { value: '6', label: 'X-Large' },
  { value: '7', label: 'XX-Large' },
];

export interface RichTextEditorHandle {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
  }
>(function RichTextEditor(
  { value, onChange, placeholder = 'Enter content...', minHeight = '200px' },
  ref
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    onChange(editorRef.current.innerHTML);
    window.setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const saved = savedRangeRef.current;
    if (!saved || !editor.contains(saved.commonAncestorContainer)) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(saved);
  }, []);

  const execCommand = useCallback(
    (command: string, commandValue?: string) => {
      restoreSelection();
      document.execCommand(command, false, commandValue);
      editorRef.current?.focus();
      handleInput();
    },
    [handleInput, restoreSelection]
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editorRef.current?.focus(),
      insertAtCursor: (text: string) => {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor || !selection) return;
        editor.focus();
        const saved = savedRangeRef.current;
        const range =
          saved && editor.contains(saved.commonAncestorContainer)
            ? saved.cloneRange()
            : document.createRange();
        if (!saved || !editor.contains(saved.commonAncestorContainer)) {
          range.selectNodeContents(editor);
          range.collapse(false);
        }
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        savedRangeRef.current = range.cloneRange();
        handleInput();
      },
    }),
    [handleInput]
  );

  return (
    <div className="vub-rich-editor">
      <div className="vub-rich-editor__toolbar">
        <button type="button" onClick={() => execCommand('bold')} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} title="Underline">
          <Underline size={16} />
        </button>
        <Popover open={fontSizeOpen} onOpenChange={setFontSizeOpen}>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(event) => event.preventDefault()} title="Font Size">
              <Type size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="vub-rich-editor__menu">
            {FONT_SIZES.map((size) => (
              <button key={size.value} type="button" onClick={() => execCommand('fontSize', size.value)}>
                {size.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Popover open={textColorOpen} onOpenChange={setTextColorOpen}>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(event) => event.preventDefault()} title="Text Color">
              <Palette size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="vub-color-picker__content">
            <ColorPickerPanel
              value={textColor}
              onChange={(color) => {
                setTextColor(color);
                execCommand('foreColor', color);
              }}
              onSelect={() => setTextColorOpen(false)}
            />
          </PopoverContent>
        </Popover>
        <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(event) => event.preventDefault()} title="Highlight">
              <Highlighter size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="vub-color-picker__content">
            <ColorPickerPanel
              value={highlightColor}
              onChange={(color) => {
                setHighlightColor(color);
                execCommand('backColor', color);
              }}
              onSelect={() => setHighlightOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        className="vub-rich-editor__surface"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
});
