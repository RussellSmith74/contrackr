"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function CategoryCombobox({ value, onChange, label, placeholder = "Search or type a category...", required, hint }: Props) {
  const [inputVal, setInputVal] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = SERVICE_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(inputVal.toLowerCase()) ||
    c.description.toLowerCase().includes(inputVal.toLowerCase())
  );

  useEffect(() => {
    setInputVal(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (label: string) => {
    setInputVal(label);
    onChange(label);
    setOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const clear = () => {
    setInputVal("");
    onChange("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-semibold text-[#0D0D0D]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputVal}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm pr-16 focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputVal && (
            <button type="button" onClick={clear} className="text-[#9CA3AF] hover:text-[#374151] p-0.5">
              <X size={14} />
            </button>
          )}
          <ChevronDown size={15} className="text-[#9CA3AF]" />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#6B7280]">
                No match — your custom category &ldquo;{inputVal}&rdquo; will be used
              </div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseDown={() => select(cat.label)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EFF6FF] text-left transition-colors"
                >
                  <span className="text-base">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0D0D0D]">{cat.label}</p>
                    <p className="text-xs text-[#9CA3AF]">{cat.description}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}
