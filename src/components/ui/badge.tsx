import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-500",
    secondary: "border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700",
    destructive: "border-transparent bg-red-950 text-red-300 border border-red-800",
    outline: "text-slate-300 border-slate-700",
    success: "border-emerald-800/60 bg-emerald-950/60 text-emerald-300",
    warning: "border-amber-800/60 bg-amber-950/60 text-amber-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
