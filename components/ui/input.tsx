import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-[#07101a] px-3 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-[#07101a] px-3 text-sm text-white outline-none transition focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-white/10 bg-[#07101a] px-3 py-2 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-pitch/70 focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  );
}

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
