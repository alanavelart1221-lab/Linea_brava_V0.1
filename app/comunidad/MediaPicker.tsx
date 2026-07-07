"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_TYPES, MAX_IMAGE_SIZE, MAX_IMAGES } from "./uploadMedia";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function MediaPicker({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError(null);

    const valid: File[] = [];
    for (const file of selected) {
      if (!IMAGE_TYPES.includes(file.type)) {
        setError("Solo se permiten imágenes (JPG, PNG, WebP o GIF).");
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Cada imagen debe pesar máximo 5 MB.");
        continue;
      }
      valid.push(file);
    }

    const next = [...files, ...valid];
    if (next.length > MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} imágenes por publicación.`);
    }
    onChange(next.slice(0, MAX_IMAGES));
  }

  function removeAt(index: number) {
    setError(null);
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      {previews.length > 0 && (
        <div className={`mt-3 grid gap-2 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {previews.map((src, i) => (
            <div key={src} className="relative overflow-hidden rounded-xl border border-ink-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Vista previa ${i + 1}`}
                className={`w-full object-cover ${previews.length === 1 ? "max-h-72" : "aspect-video"}`}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/80 text-xs text-bone backdrop-blur-sm hover:bg-ink-800"
                aria-label="Quitar imagen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {files.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex items-center gap-2 text-sm text-mute transition-colors hover:text-trail-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
            <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {files.length === 0 ? "Adjuntar fotos" : "Agregar otra"}
        </button>
      )}
    </div>
  );
}
