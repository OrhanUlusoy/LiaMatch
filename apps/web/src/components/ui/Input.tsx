import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm",
        "placeholder:text-neutral-400",
        "focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-300",
        className,
      )}
      {...props}
    />
  );
}
