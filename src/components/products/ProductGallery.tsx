"use client";

import { useRef, useState } from "react";
import { ImagePlaceholder, ProductPhoto } from "@/components/media/ProductPhoto";
import { isPhotoUrl } from "@/lib/media";
import type { ProductImage } from "@/types";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const photos = images.filter((image) => isPhotoUrl(image.url));
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const touchX = useRef<number | null>(null);
  const current = photos[active] ?? photos[0];

  function go(delta: number) {
    if (photos.length < 2) return;
    setLoaded(false);
    setActive((index) => (index + delta + photos.length) % photos.length);
  }

  if (!current) {
    return (
      <div className="relative aspect-[4/5] bg-[#e5ebf2] sm:aspect-[5/4]">
        <ImagePlaceholder label={name} />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#e5ebf2] sm:aspect-[5/4]"
        onTouchStart={(event) => {
          touchX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current == null) return;
          const end = event.changedTouches[0]?.clientX ?? touchX.current;
          const diff = end - touchX.current;
          if (diff > 40) go(-1);
          if (diff < -40) go(1);
          touchX.current = null;
        }}
      >
        {!loaded ? <div className="absolute inset-0 z-10 animate-pulse bg-[#dbe3ed]" aria-hidden="true" /> : null}
        <ProductPhoto
          key={current.url}
          src={current.url}
          alt={current.alt_text ?? name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          onReady={() => setLoaded(true)}
        />
        {photos.length > 1 ? (
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 p-3">
            <button type="button" className="btn btn-ghost bg-white/95 px-3" onClick={() => go(-1)}>
              Previous
            </button>
            <p className="bg-white/95 px-3 py-2 text-sm">
              {active + 1} / {photos.length}
            </p>
            <button type="button" className="btn btn-ghost bg-white/95 px-3" onClick={() => go(1)}>
              Next
            </button>
          </div>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => {
                setLoaded(false);
                setActive(index);
              }}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              className={`relative h-[4.5rem] w-16 shrink-0 overflow-hidden border-2 ${
                index === active ? "border-ink" : "border-transparent"
              }`}
            >
              <ProductPhoto src={image.url} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
