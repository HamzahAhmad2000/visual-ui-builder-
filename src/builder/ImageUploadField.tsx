'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, Crop as CropIcon, Loader2, ImageIcon, ZoomIn } from 'lucide-react';
import { ThemedButton } from '../ui/primitives';
import { resolveMediaUrl } from '../utils/media-url';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

interface ImageUploadFieldProps {
  /** Current image URL/path ('' or null when unset). */
  value: string | null;
  onChange: (url: string | null) => void;
  /** Uploads the (cropped) file and resolves to the stored URL/path. */
  upload: (file: File) => Promise<string>;
  /** Crop aspect ratio; defaults to 1 (square-only cropping). */
  aspect?: number;
  label?: string;
  disabled?: boolean;
}

interface CropState {
  scale: number;
  minScale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Reusable image field: drag & drop or browse, then crop (square by default)
 * before uploading. Used by the content builder, announcements, and pop-ups.
 */
export function ImageUploadField({
  value,
  onChange,
  upload,
  aspect = 1,
  label = 'Image',
  disabled = false,
}: ImageUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSource, setCropSource] = useState<{ url: string; name: string; type: string } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!VALID_TYPES.includes(file.type)) {
      setError('Invalid file type. Use PNG, JPG, JPEG, GIF, or WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is larger than 5MB. Please choose a smaller image.');
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    setCropSource({ url, name: file.name, type: file.type === 'image/gif' ? 'image/png' : file.type });
  };

  const handleCropped = async (blob: Blob) => {
    if (!cropSource) return;
    setUploading(true);
    setError(null);
    try {
      const baseName = cropSource.name.replace(/\.[^.]+$/, '');
      const ext = cropSource.type === 'image/png' ? 'png' : cropSource.type === 'image/webp' ? 'webp' : 'jpg';
      const file = new File([blob], `${baseName}-cropped.${ext}`, { type: cropSource.type });
      const url = await upload(file);
      onChange(url);
      closeCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const closeCrop = () => {
    if (cropSource) URL.revokeObjectURL(cropSource.url);
    setCropSource(null);
  };

  const previewUrl = value ? resolveMediaUrl(value) || value : null;

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={label}
            className="max-h-48 max-w-full rounded-[var(--border-radius-md)] border border-[var(--border)] object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (!disabled) acceptFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--border-radius-md)] border-2 border-dashed p-6 text-center transition-all duration-200 ${
            dragOver
              ? 'border-purple-500 bg-purple-50/50'
              : 'border-[var(--border)] hover:border-purple-400 hover:bg-purple-50/20'
          } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
          <ImageIcon className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Drag & drop an image, or click to browse
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            PNG, JPG, GIF, WebP up to 5MB • cropped {aspect === 1 ? 'square' : `at ${aspect}:1`}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={VALID_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {error && <p className="text-xs text-[var(--error-600,#dc2626)]">{error}</p>}

      {cropSource && (
        <CropDialog
          sourceUrl={cropSource.url}
          aspect={aspect}
          uploading={uploading}
          mimeType={cropSource.type}
          onCancel={closeCrop}
          onConfirm={handleCropped}
        />
      )}
    </div>
  );
}

const VIEWPORT_WIDTH = 320;

function CropDialog({
  sourceUrl,
  aspect,
  uploading,
  mimeType,
  onCancel,
  onConfirm,
}: {
  sourceUrl: string;
  aspect: number;
  uploading: boolean;
  mimeType: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const viewportHeight = Math.round(VIEWPORT_WIDTH / aspect);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<CropState>({ scale: 1, minScale: 1, offsetX: 0, offsetY: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const minScale = Math.max(VIEWPORT_WIDTH / img.naturalWidth, viewportHeight / img.naturalHeight);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setCrop({
        scale: minScale,
        minScale,
        offsetX: (VIEWPORT_WIDTH - img.naturalWidth * minScale) / 2,
        offsetY: (viewportHeight - img.naturalHeight * minScale) / 2,
      });
    };
    img.src = sourceUrl;
  }, [sourceUrl, viewportHeight]);

  const clampOffsets = useCallback(
    (state: CropState): CropState => {
      if (!natural) return state;
      const scaledW = natural.w * state.scale;
      const scaledH = natural.h * state.scale;
      return {
        ...state,
        offsetX: Math.min(0, Math.max(VIEWPORT_WIDTH - scaledW, state.offsetX)),
        offsetY: Math.min(0, Math.max(viewportHeight - scaledH, state.offsetY)),
      };
    },
    [natural, viewportHeight]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: crop.offsetX,
      baseY: crop.offsetY,
    };
    const move = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setCrop((prev) =>
        clampOffsets({
          ...prev,
          offsetX: drag.baseX + (ev.clientX - drag.startX),
          offsetY: drag.baseY + (ev.clientY - drag.startY),
        })
      );
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleZoom = (nextScale: number) => {
    setCrop((prev) => {
      // Zoom around the viewport center.
      const centerX = (VIEWPORT_WIDTH / 2 - prev.offsetX) / prev.scale;
      const centerY = (viewportHeight / 2 - prev.offsetY) / prev.scale;
      return clampOffsets({
        ...prev,
        scale: nextScale,
        offsetX: VIEWPORT_WIDTH / 2 - centerX * nextScale,
        offsetY: viewportHeight / 2 - centerY * nextScale,
      });
    });
  };

  const handleConfirm = () => {
    if (!natural || !imgRef.current) return;
    const sourceX = -crop.offsetX / crop.scale;
    const sourceY = -crop.offsetY / crop.scale;
    const sourceW = VIEWPORT_WIDTH / crop.scale;
    const sourceH = viewportHeight / crop.scale;

    const outputW = Math.min(1200, Math.round(sourceW));
    const outputH = Math.round(outputW / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceW, sourceH, 0, 0, outputW, outputH);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      mimeType,
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--border-radius-lg)] border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <CropIcon className="h-4 w-4 text-purple-600" />
            Crop image {aspect === 1 ? '(square)' : ''}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            aria-label="Cancel crop"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-[var(--border-radius-md)] border border-[var(--border)] bg-[var(--surface)] active:cursor-grabbing"
          style={{ width: VIEWPORT_WIDTH, height: viewportHeight }}
          onPointerDown={handlePointerDown}
        >
          <img
            ref={imgRef}
            src={sourceUrl}
            alt="Crop preview"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: natural ? natural.w * crop.scale : undefined,
              height: natural ? natural.h * crop.scale : undefined,
              left: crop.offsetX,
              top: crop.offsetY,
            }}
          />
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="border border-white/80" />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ZoomIn className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
          <input
            type="range"
            min={crop.minScale}
            max={crop.minScale * 4}
            step={0.01}
            value={crop.scale}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Drag the image to reposition; use the slider to zoom.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <ThemedButton type="button" variant="outline" size="sm" onClick={onCancel} disabled={uploading}>
            Cancel
          </ThemedButton>
          <ThemedButton type="button" size="sm" onClick={handleConfirm} disabled={uploading || !natural}>
            {uploading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-1 h-4 w-4" />
                Crop & Upload
              </>
            )}
          </ThemedButton>
        </div>
      </div>
    </div>
  );
}
