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
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40",
        className,
      )}
    >
      <div className="mb-3 rounded-full bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
        <SearchX className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
