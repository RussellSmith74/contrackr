import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "green" | "yellow" | "red" | "navy";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[#F3F4F6] text-[#374151]",
    blue: "bg-[#EFF6FF] text-[#1E6FFF]",
    green: "bg-[#ECFDF5] text-[#059669]",
    yellow: "bg-[#FFFBEB] text-[#D97706]",
    red: "bg-[#FEF2F2] text-[#DC2626]",
    navy: "bg-[#0A1628] text-white",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
