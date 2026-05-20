import { cn } from "@/lib/utils";

export function FieldError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;

  return <p className={cn("text-xs font-medium text-rose-500", className)}>{message}</p>;
}
