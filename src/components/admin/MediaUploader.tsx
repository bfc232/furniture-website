"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function MediaUploader({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const next = [...urls];
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const data = await response.json();
        if (!response.ok || !data.url) {
          throw new Error(data.error || "Upload failed");
        }
        next.push(data.url);
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;
    onChange([...urls, value]);
    setUrlDraft("");
  }

  return (
    <div className="space-y-3">
      {urls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-[#e5ebf2]">
              <Image src={url} alt="" fill className="object-cover" sizes="30vw" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-ink px-2 py-1 text-[10px] text-white"
                onClick={() => onChange(urls.filter((_, i) => i !== index))}
              >
                Remove
              </button>
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px]">
                  Primary
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">Add at least one product photo. You can replace these later.</p>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => uploadFiles(e.target.files)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-ghost text-sm" onClick={() => galleryRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Choose photos"}
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => cameraRef.current?.click()} disabled={busy}>
          Take photo
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="field text-sm"
          placeholder="Or paste image URL"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
        />
        <button type="button" className="btn btn-ghost shrink-0 text-sm" onClick={addUrl}>
          Add URL
        </button>
      </div>
      {error ? <p className="text-xs text-rose-800">{error}</p> : null}
    </div>
  );
}
