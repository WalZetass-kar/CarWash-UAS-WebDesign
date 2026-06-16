import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] ring-1 ring-inset backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-cyan-50/90 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-400/12 dark:text-cyan-200 dark:ring-cyan-400/20",
        success:
          "bg-emerald-50/92 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/12 dark:text-emerald-200 dark:ring-emerald-400/20",
        warning:
          "bg-amber-50/92 text-amber-700 ring-amber-600/20 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-400/20",
        destructive:
          "bg-rose-50/92 text-rose-700 ring-rose-600/20 dark:bg-rose-400/12 dark:text-rose-200 dark:ring-rose-400/20",
        secondary:
          "bg-slate-100/95 text-slate-700 ring-slate-600/10 dark:bg-slate-800/95 dark:text-slate-200 dark:ring-slate-700",
        neutral:
          "bg-slate-50 text-slate-600 ring-slate-500/15 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
