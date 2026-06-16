import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-ring flex min-h-64 flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-slate-300/90 bg-gradient-to-br from-white to-slate-50/80 p-8 text-center dark:border-slate-700/80 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/70",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl border border-cyan-200/70 bg-cyan-50/90 p-3.5 text-cyan-600 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
        <SearchX className="size-6" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
