import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      default:
        "bg-blue-600 text-white shadow hover:bg-blue-500 active:bg-blue-700",
      destructive:
        "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
      outline:
        "border border-slate-700 bg-transparent text-slate-200 shadow-sm hover:bg-slate-800 hover:text-white",
      secondary:
        "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700 active:bg-slate-800",
      ghost: "hover:bg-slate-800 hover:text-white text-slate-300",
      link: "text-blue-400 underline-offset-4 hover:underline",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
