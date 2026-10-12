"use client";

import Image from "next/image";
import { useState } from "react";
import { isPhotoUrl } from "@/lib/media";

export function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e5ebf2] px-4 text-center">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#64748b]">
        Image placeholder
      </p>
      <p className="mt-2 max-w-[14rem] font-serif text-xl leading-tight text-[#0b1f3a]">{label}</p>
      <p className="mt-2 max-w-[16rem] text-sm leading-5 text-[#64748b]">
        Add a photograph from the admin panel.
      </p>
    </div>
  );
}

export function ProductPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
  onReady,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  onReady?: () => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;

  if (!isPhotoUrl(src) || failed) {
    return <ImagePlaceholder label={alt} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onLoad={() => onReady?.()}
      onError={() => {
        setFailedSrc(src);
        onReady?.();
      }}
    />
  );
}
