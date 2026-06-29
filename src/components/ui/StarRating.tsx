"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showCount = false,
  count,
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  const sizes = { sm: 12, md: 16, lg: 20 };
  const px = sizes[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(i + 1)}
              className={cn(
                "relative",
                interactive && "hover:scale-110 transition-transform cursor-pointer",
                !interactive && "cursor-default"
              )}
            >
              <Star
                size={px}
                className={cn(
                  filled
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : partial
                    ? "fill-[#FDE68A] text-[#F59E0B]"
                    : "fill-[#E5E7EB] text-[#E5E7EB]"
                )}
              />
            </button>
          );
        })}
      </div>
      {showCount && (
        <span className={cn("text-[#6B7280]", size === "sm" ? "text-xs" : "text-sm")}>
          {rating.toFixed(1)}
          {count !== undefined && (
            <span className="ml-1">({count.toLocaleString()})</span>
          )}
        </span>
      )}
    </div>
  );
}
