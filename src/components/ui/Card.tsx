import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  border?: boolean;
}

export function Card({
  padding = "md",
  hover = false,
  border = true,
  className,
  children,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl",
        border && "border border-[#E5E7EB]",
        paddings[padding],
        hover && "hover:shadow-md hover:border-[#D1D5DB] transition-all duration-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-bold text-[#0D0D0D]", className)}
      {...props}
    >
      {children}
    </h3>
  );
}
