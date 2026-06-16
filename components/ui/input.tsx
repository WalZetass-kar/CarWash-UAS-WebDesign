import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/88 px-3.5 py-2 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/12 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/90 dark:bg-slate-950/84 dark:text-slate-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
