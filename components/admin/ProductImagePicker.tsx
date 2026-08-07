'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  UploadCloud,
  ImageIcon,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { MediaAsset } from '@/app/api/admin/media/route';

interface ProductImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Replaces the old "type a path into a text box" field. Admins upload a real
 * image, name it so it can be found again, and see a thumbnail of every asset
 * before choosing — previously the only feedback was a raw string.
 */
export function ProductImagePicker({ value, onChange, error }: ProductImagePickerProps) {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCustomPath, setShowCustomPath] = useState(false);

  // Staged upload: the file plus the name the admin gives it before committing.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState('');

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Object URLs must be revoked or the blob leaks for the tab's lifetime.
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const stageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image', { description: file.type || 'unknown type' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image is too large', {
        description: `${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.`,
      });
      return;
    }

    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setPendingName(file.name.replace(/\.[^.]+$/, ''));
  };

  const clearStaged = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setPendingName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    if (!pendingName.trim()) {
      toast.error('Give the image a name', {
        description: 'The name is how you will find this image in the library later.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', pendingFile);
      body.append('name', pendingName.trim());

      const res = await fetch('/api/admin/media', { method: 'POST', body });
      const data = await res.json();

      if (data.success && data.asset) {
        setAssets((prev) => [data.asset, ...prev]);
        onChange(data.asset.url);
        clearStaged();
        if (data.warning) {
          toast.warning('Uploaded with a caveat', { description: data.warning });
        } else {
          toast.success('Image uploaded', { description: `Saved to the library as “${data.asset.name}”.` });
        }
      } else {
        toast.error('Upload failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    const confirmed = await confirm({
      title: 'Delete this image?',
      description: (
        <>
          <strong className="font-semibold text-[#111827]">{asset.name}</strong> will be removed from
          storage and the media library. Products already using it would lose their photo.
        </>
      ),
      confirmLabel: 'Delete Image',
      intent: 'destructive',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        toast.success('Image deleted');
      } else {
        toast.error('Could not delete image', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Could not delete image', { description: err.message });
    }
  };

  const selectedAsset = assets.find((asset) => asset.url === value);

  return (
    <div className="space-y-3">
      {/* ── Current selection ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#C6DFD1] bg-white p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#EAF2ED] bg-[#FDFBF7]">
          {value ? (
            <Image
              src={value}
              alt="Selected product image"
              fill
              sizes="64px"
              className="object-contain p-1.5"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#C6DFD1]">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
            Selected image
          </div>
          <div className="truncate text-xs font-bold text-[#111827]">
            {selectedAsset?.name || (value ? 'Custom path' : 'None selected')}
          </div>
          <div className="truncate font-mono text-[10px] text-[#9CA3AF]">{value || '—'}</div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomPath((open) => !open)}
          title="Enter an image path manually"
          className={cn(
            'shrink-0 rounded-lg border p-2 transition-colors focus-luxe',
            showCustomPath
              ? 'border-[#2E5A44] bg-[#EAF2ED] text-[#2E5A44]'
              : 'border-[#E5E2D9] text-[#6B7280] hover:border-[#2E5A44] hover:text-[#2E5A44]'
          )}
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>

      {showCustomPath && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/whey-isolate.svg or https://…"
          className="w-full rounded-xl border border-[#C6DFD1] bg-white px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-[#2E5A44]/30"
        />
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      {/* ── Upload ─────────────────────────────────────────────────────────── */}
      {pendingFile ? (
        <div className="space-y-3 rounded-2xl border border-[#2E5A44]/40 bg-[#EAF2ED]/40 p-3">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#C6DFD1] bg-white">
              {/* Local blob preview — plain <img> so next/image never tries to
                  optimise an object URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreview || ''}
                alt="Upload preview"
                className="h-full w-full object-contain p-1.5"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#2E5A44]">
                Image name *
              </label>
              <input
                type="text"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                placeholder="e.g. Vanilla Whey — front of tub"
                className="w-full rounded-xl border border-[#C6DFD1] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#2E5A44]/30"
              />
              <p className="text-[10px] text-[#6B7280]">
                {(pendingFile.size / 1024).toFixed(0)} KB · {pendingFile.type} — saved under this name
                so you can reuse it later.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={clearStaged}
              disabled={isUploading}
              className="rounded-xl bg-white px-4 py-2 text-[11px] font-bold text-[#4B5563] border border-[#E5E2D9] hover:bg-[#F5F0E4] disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2 text-[11px] font-bold text-white shadow-md hover:bg-[#234735] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  Save to Library
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) stageFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            isDragging
              ? 'border-[#2E5A44] bg-[#EAF2ED]'
              : 'border-[#C6DFD1] bg-white hover:border-[#2E5A44] hover:bg-[#EAF2ED]/40'
          )}
        >
          <UploadCloud className="h-5 w-5 text-[#2E5A44]" />
          <span className="text-[11px] font-bold text-[#111827]">
            Drop a new product photo here, or click to browse
          </span>
          <span className="text-[10px] text-[#9CA3AF]">PNG, JPEG, WebP, AVIF or SVG · up to 5 MB</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) stageFile(file);
        }}
      />

      {/* ── Library ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
            Media library {assets.length > 0 && `(${assets.length})`}
          </span>
          <button
            type="button"
            onClick={loadAssets}
            aria-label="Refresh media library"
            className="rounded-full p-1 text-[#6B7280] hover:text-[#2E5A44] focus-luxe"
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-[#F5F0E4]" />
            ))}
          </div>
        ) : (
          <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            {assets.map((asset) => {
              const isSelected = asset.url === value;
              return (
                <div key={asset.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onChange(asset.url)}
                    title={asset.name}
                    className={cn(
                      'flex w-full flex-col overflow-hidden rounded-xl border bg-white transition-all focus-luxe',
                      isSelected
                        ? 'border-[#2E5A44] ring-2 ring-[#2E5A44]/25'
                        : 'border-[#E5E2D9] hover:border-[#2E5A44]'
                    )}
                  >
                    <div className="relative aspect-square w-full bg-[#FDFBF7]">
                      <Image
                        src={asset.url}
                        alt={asset.name}
                        fill
                        sizes="120px"
                        className="object-contain p-2"
                      />
                      {isSelected && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2E5A44] text-white">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <span className="truncate px-1.5 py-1 text-[9px] font-semibold text-[#4B5563]">
                      {asset.name}
                    </span>
                  </button>

                  {!asset.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(asset)}
                      aria-label={`Delete ${asset.name}`}
                      className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-[#9A3A3A] opacity-0 shadow-sm transition-opacity hover:bg-[#FDECEC] group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
