import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-[#07101a] px-3 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-[#07101a] px-3 text-sm text-white outline-none transition focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-md border border-white/10 bg-[#07101a] px-3 py-2 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("font-label text-sm uppercase tracking-wide text-muted", className)}
      {...props}
    />
  );
}
