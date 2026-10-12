"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  desktop: string;
  mobile: string | null;
  title: string;
  href: string;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const slide = slides[index] ?? slides[0];

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  if (!slide) return null;

  function step(delta: number) {
    setIndex((current) => (current + delta + slides.length) % slides.length);
  }

  return (
    <section
      className="border-b border-line bg-[#edf2f7]"
      aria-roledescription="carousel"
      aria-label="Featured announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStart == null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
        if (delta > 48) step(-1);
        if (delta < -48) step(1);
        setTouchStart(null);
      }}
    >
      <h1 className="sr-only">{slide.title}</h1>
      <div className="container-page py-4 sm:py-6">
        <div className="relative overflow-hidden rounded-2xl border border-white bg-[#dfe7ef] shadow-[0_20px_60px_rgba(11,31,58,0.16)]">
        {slides.map((item, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={item.desktop}
              className={active ? "relative" : "pointer-events-none absolute inset-0 opacity-0"}
              aria-hidden={!active}
            >
              <Link href={item.href} tabIndex={active ? 0 : -1} aria-label={item.title} className="block">
                <BannerFrame
                  src={item.mobile ?? item.desktop}
                  aspect="aspect-[2/1]"
                  className="lg:hidden"
                  priority={slideIndex === 0}
                />
                <BannerFrame
                  src={item.desktop}
                  aspect="h-[clamp(18rem,38vh,24rem)]"
                  className="hidden lg:block"
                  backdrop
                  priority={slideIndex === 0}
                />
              </Link>
            </div>
          );
        })}
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 text-2xl leading-none text-ink shadow-lg transition hover:scale-105 sm:left-5"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 text-2xl leading-none text-ink shadow-lg transition hover:scale-105 sm:right-5"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        ) : null}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-2 pb-4">
          {slides.map((item, slideIndex) => (
            <button
              key={item.href + item.title}
              type="button"
              aria-label={`Show banner ${slideIndex + 1}`}
              aria-current={slideIndex === index ? "true" : undefined}
              onClick={() => setIndex(slideIndex)}
              className={`h-2 rounded-full transition-all ${slideIndex === index ? "w-9 bg-accent" : "w-2 bg-slate-300"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BannerFrame({
  src,
  aspect,
  className,
  priority,
  backdrop = false,
}: {
  src: string;
  aspect: string;
  className: string;
  priority: boolean;
  backdrop?: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-[#dfe7ef] ${aspect} ${className}`}>
      {backdrop ? (
        <>
          <Image
            src={src}
            alt=""
            fill
            aria-hidden="true"
            sizes="100vw"
            className="scale-110 object-cover opacity-40 blur-2xl"
          />
          <div className="absolute inset-0 bg-[#0b1f3a]/15" />
        </>
      ) : null}
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-contain"
      />
    </div>
  );
}
