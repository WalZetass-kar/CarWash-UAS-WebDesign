import { Badge } from "@/components/ui/badge";
import { AiReviewManager } from "@/features/ai-analysis/ai-review-manager";
import { requireRole } from "@/lib/auth/session";
import { listAiReviews } from "@/services/ai-reviews";

export const metadata = {
  title: "Analisis AI",
};

export default async function AiAnalysisPage() {
  await requireRole(["admin", "kasir", "staff", "petugas"]);
  const reviews = JSON.parse(JSON.stringify(await listAiReviews()));

  return (
    <div className="space-y-6">
      <div>
        <Badge>Keyword NLP Indonesia</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Analisis AI</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Analisis sentimen review pelanggan, confidence score, distribusi sentimen, dan riwayat review dalam satu panel.
        </p>
      </div>
      <AiReviewManager initialData={reviews} />
    </div>
  );
}
