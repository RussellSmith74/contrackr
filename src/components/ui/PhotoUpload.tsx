"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PhotoUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  label?: string;
  hint?: string;
  className?: string;
}

export function PhotoUpload({
  value,
  onChange,
  maxFiles = 10,
  label,
  hint,
  className,
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = maxFiles - value.length;
      const toAdd = accepted.slice(0, remaining);
      const newFiles = [...value, ...toAdd];
      onChange(newFiles);

      const newPreviews = toAdd.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    },
    [value, onChange, maxFiles]
  );

  const remove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles,
    disabled: value.length >= maxFiles,
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <label className="text-sm font-semibold text-[#0D0D0D]">
          {label}
        </label>
      )}

      {/* Drop zone */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
            isDragActive
              ? "border-[#1E6FFF] bg-[#EFF6FF]"
              : "border-[#D1D5DB] hover:border-[#1E6FFF] hover:bg-[#F8FAFC]"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center">
            {isDragActive ? (
              <ImagePlus size={22} className="text-[#1E6FFF]" />
            ) : (
              <Camera size={22} className="text-[#6B7280]" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0D0D0D]">
              {isDragActive ? "Drop photos here" : "Add Photos"}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Tap to choose or drag & drop — JPG, PNG, WEBP
            </p>
          </div>
          {hint && <p className="text-xs text-[#6B7280] text-center">{hint}</p>}
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image
                src={src}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-[#6B7280]">
          {value.length} of {maxFiles} photos added
        </p>
      )}
    </div>
  );
}
