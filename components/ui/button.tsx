import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-[0.01em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-950 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyan-600 via-sky-600 to-cyan-600 text-white shadow-[0_18px_32px_-20px_rgba(8,145,178,0.9)] hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-22px_rgba(8,145,178,0.95)]",
        secondary:
          "bg-slate-100/90 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline:
          "border border-slate-200/80 bg-white/90 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/60 dark:border-slate-700 dark:bg-slate-950/88 dark:text-slate-100 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900",
        ghost:
          "text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-slate-800/90",
        destructive: "bg-rose-600 text-white shadow-[0_18px_32px_-20px_rgba(225,29,72,0.8)] hover:-translate-y-0.5 hover:bg-rose-700",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-2xl px-6",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
