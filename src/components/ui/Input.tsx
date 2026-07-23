"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#0D0D0D] dark:text-white">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#94A3B8]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] px-4 py-3 text-sm text-[#0D0D0D] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] transition-colors",
              "focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF]",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#0D0D0D] dark:text-white">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={4}
          className={cn(
            "w-full rounded-lg border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] px-4 py-3 text-sm text-[#0D0D0D] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] transition-colors resize-none",
            "focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-[#0D0D0D] dark:text-white">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0A1628] px-4 py-3 text-sm text-[#0D0D0D] dark:text-white transition-colors appearance-none",
            "focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF]",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
