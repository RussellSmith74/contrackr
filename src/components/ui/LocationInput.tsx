"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    state_abbreviation?: string;
  };
}

interface LocationInputProps {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function LocationInput({ value, onChange, placeholder = "City, State", label, required }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us&addressdetails=1`,
        { headers: { "User-Agent": "Contrakr/1.0 (contrakr.com)" } }
      );
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (s: Suggestion) => {
    const city = s.address.city ?? s.address.town ?? s.address.village ?? "";
    const state = s.address.state_abbreviation ?? s.address.state ?? "";
    const label = city && state ? `${city}, ${state}` : s.display_name.split(",").slice(0, 2).join(",").trim();
    onChange(label, { lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatSuggestion = (s: Suggestion) => {
    const city = s.address.city ?? s.address.town ?? s.address.village ?? "";
    const state = s.address.state ?? "";
    if (city && state) return { primary: city, secondary: state };
    const parts = s.display_name.split(",");
    return { primary: parts[0].trim(), secondary: parts.slice(1, 3).join(",").trim() };
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-sm font-semibold text-[#0D0D0D] dark:text-white">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-9 py-3 rounded-lg border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C] text-sm text-[#0D0D0D] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E6FFF] focus:border-transparent transition"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => {
            const { primary, secondary } = formatSuggestion(s);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#1E3A5F] transition-colors text-left border-b border-[#F3F4F6] dark:border-[#1E3A5F] last:border-0"
              >
                <MapPin size={14} className="text-[#1E6FFF] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0D0D0D] dark:text-white truncate">{primary}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{secondary}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
