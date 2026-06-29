import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: { container: "w-6 h-6", text: "text-xs" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-base" },
  xl: { container: "w-20 h-20", text: "text-xl" },
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const s = sizes[size];

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex-shrink-0 bg-[#0A1628] flex items-center justify-center",
        s.container,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
        />
      ) : (
        <span className={cn("font-bold text-white", s.text)}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
