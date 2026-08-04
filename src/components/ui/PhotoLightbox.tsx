"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoLightboxProps {
  photos: string[];
  /** Index of the photo to show, or null when the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) {
  const isOpen = index !== null && photos.length > 0;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange]
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);

    // Stop the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, step]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 p-3 text-white/90 bg-black/40 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X size={24} />
      </button>

      {photos.length > 1 && (
        <span className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 text-white/70 text-[13px] font-semibold tracking-wide">
          {index + 1} / {photos.length}
        </span>
      )}

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-6 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next photo"
            className="absolute right-2 sm:right-6 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      {/* Clicking the image itself shouldn't dismiss — only the backdrop does. */}
      <div
        className="relative w-full h-full max-w-6xl max-h-[88vh] mx-4 my-14"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photos[index]}
          alt={`Photo ${index + 1} of ${photos.length}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
    </div>
  );
}
