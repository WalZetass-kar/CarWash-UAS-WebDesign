import { shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import type { AiReviewAnalysis } from "@/lib/data";
import { analyzeReviewSentiment } from "@/lib/review-sentiment";
import type { AiReviewInput } from "@/schemas/ai-review";

const inMemoryAnalyses: AiReviewAnalysis[] = [];

export async function listAiReviews(
  query = "",
  sentiment?: string | null,
): Promise<AiReviewAnalysis[]> {
  const normalized = query.toLowerCase();

  let items: AiReviewAnalysis[];

  if (shouldUseTestFixtures()) {
    items = getDemoState().aiReviewAnalyses;
  } else {
    items = inMemoryAnalyses;
  }

  return items
    .filter((item) => {
      if (!normalized) return true;
      return (
        item.customerName.toLowerCase().includes(normalized) ||
        item.review.toLowerCase().includes(normalized)
      );
    })
    .filter((item) => {
      if (!sentiment || sentiment === "all") return true;
      return item.sentiment === sentiment;
    });
}

export async function createAiReviewAnalysis(
  input: AiReviewInput,
): Promise<AiReviewAnalysis> {
  const { sentiment, confidenceScore } = analyzeReviewSentiment(input.review);

  const analysis: AiReviewAnalysis = {
    id: crypto.randomUUID(),
    customerName: input.customerName,
    review: input.review,
    sentiment,
    confidenceScore,
    createdAt: new Date().toISOString(),
  };

  if (shouldUseTestFixtures()) {
    getDemoState().aiReviewAnalyses.unshift(analysis);
  } else {
    inMemoryAnalyses.unshift(analysis);
  }

  return analysis;
}
