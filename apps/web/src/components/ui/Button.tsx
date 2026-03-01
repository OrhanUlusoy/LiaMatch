import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-neutral-900/20",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-neutral-900 text-white hover:bg-neutral-800",
        variant === "secondary" &&
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        variant === "ghost" && "bg-transparent text-neutral-900 hover:bg-neutral-100",
        className,
      )}
      {...props}
    />
  );
}
