import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20",
        success:
          "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
        warning:
          "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
        destructive:
          "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
        secondary:
          "bg-slate-100 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
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
