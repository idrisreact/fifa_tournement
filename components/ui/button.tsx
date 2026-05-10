import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "icon";
};

export function Button({
  asChild,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-label uppercase tracking-wide transition disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-base",
        size === "icon" && "h-11 w-11",
        variant === "primary" &&
          "border-pitch/50 bg-pitch text-[#031008] shadow-glow hover:bg-[#22df73]",
        variant === "secondary" &&
          "border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:bg-white/[0.07] hover:text-white",
        variant === "danger" &&
          "border-red-400/30 bg-red-500/12 text-red-200 hover:bg-red-500/20",
        variant === "gold" &&
          "border-gold/50 bg-gold text-[#171200] shadow-gold hover:bg-[#ffe35c]",
        className
      )}
      {...props}
    />
  );
}
