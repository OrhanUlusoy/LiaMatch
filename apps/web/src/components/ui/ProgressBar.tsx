"use client";

import { cn } from "@/lib/cn";

type Props = {
  value: number; // 0-100
  label: string;
};

export function ProgressBar({ value, label }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            clamped >= 80 ? "bg-green-500" : clamped >= 50 ? "bg-yellow-500" : "bg-red-500",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
