"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const Tabs = ({
  value,
  onValueChange,
  defaultValue,
  children,
  className,
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [currentValue, setCurrentValue] = React.useState(value || defaultValue || "");

  const activeValue = value !== undefined ? value : currentValue;
  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setCurrentValue(val);
    }
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("space-y-6", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-start rounded-xl bg-slate-950 p-1 text-slate-400 border border-slate-800 shadow-inner",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
          : "hover:bg-slate-900 hover:text-slate-200 text-slate-400",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "focus-visible:outline-none animate-in fade-in-50 duration-200",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
