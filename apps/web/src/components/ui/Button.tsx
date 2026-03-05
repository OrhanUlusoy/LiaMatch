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
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,#7c3aed,#0e7490)] text-white hover:brightness-110",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:opacity-80",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-secondary",
        className,
      )}
      {...props}
    />
  );
}
